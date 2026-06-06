import { Body, Controller, Post, Req } from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { PublicRoute } from "../../core/decorators/public.decorator";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  tenantSlug!: string;
}

class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @PublicRoute()
  @Post("login")
  login(@Body() dto: LoginDto, @Req() request: { headers: Record<string, string | undefined>; ip?: string }) {
    return this.auth.login(dto, {
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    });
  }

  @PublicRoute()
  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @PublicRoute()
  @Post("logout")
  logout(@Body() dto: RefreshDto) {
    return this.auth.revoke(dto.refreshToken);
  }
}
