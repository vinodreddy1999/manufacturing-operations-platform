import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { PUBLIC_ROUTE_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token && process.env.AUTH_MODE === "demo") {
      request.user = {
        id: "demo-user",
        tenantId: request.headers["x-tenant-id"] ?? "demo-tenant",
        permissions: ["platform.admin"],
      };
      return true;
    }

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      request.user = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "local-development-access-secret",
      });
    } catch {
      throw new UnauthorizedException("Invalid bearer token");
    }

    return true;
  }
}
