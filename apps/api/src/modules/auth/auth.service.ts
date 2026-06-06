import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../core/database/prisma.service";

interface LoginInput {
  email: string;
  password: string;
  tenantSlug: string;
}

interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  static hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `scrypt:${salt}:${hash}`;
  }

  async login(input: LoginInput, context: SessionContext) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
    });

    if (!tenant) {
      throw new UnauthorizedException("Invalid tenant or credentials");
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: input.email.toLowerCase(),
        },
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid tenant or credentials");
    }

    const permissions = this.extractPermissions(user);
    const accessToken = await this.signAccessToken(user, tenant.id, permissions);
    const refreshToken = randomBytes(48).toString("base64url");

    await this.prisma.refreshToken.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: tenant.id,
        permissions,
      },
    };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(refreshToken) },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return {
      accessToken: await this.signAccessToken(user, session.tenantId, this.extractPermissions(user)),
    };
  }

  async revoke(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  private verifyPassword(password: string, stored: string) {
    const [, salt, expected] = stored.split(":");
    if (!salt || !expected) {
      return false;
    }
    const actual = scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expected, "hex");
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
  }

  private refreshTtlMs() {
    const days = Number(process.env.JWT_REFRESH_TTL_DAYS ?? "30");
    return days * 24 * 60 * 60 * 1000;
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private extractPermissions(user: {
    roles: Array<{
      role: { permissions: Array<{ permission: { key: string } }> };
    }>;
  }) {
    return Array.from(
      new Set(user.roles.flatMap((assignment) => assignment.role.permissions.map((entry) => entry.permission.key))),
    );
  }

  private signAccessToken(
    user: { id: string; email: string },
    tenantId: string,
    permissions: string[],
  ) {
    return this.jwt.signAsync(
      {
        sub: user.id,
        id: user.id,
        tenantId,
        email: user.email,
        permissions,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? "local-development-access-secret",
        expiresIn: process.env.JWT_ACCESS_TTL ?? "15m",
      },
    );
  }
}
