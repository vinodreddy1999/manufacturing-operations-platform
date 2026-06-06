import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "./permissions.guard";

function createContext(permissions: string[]) {
  return {
    getHandler: () => "handler",
    getClass: () => "class",
    switchToHttp: () => ({
      getRequest: () => ({
        user: { permissions },
      }),
    }),
  } as never;
}

describe("PermissionsGuard", () => {
  it("allows platform admins through module permissions", () => {
    const reflector = {
      getAllAndOverride: () => ["inventory.read"],
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(createContext(["platform.admin"]))).toBe(true);
  });

  it("blocks users missing required permissions", () => {
    const reflector = {
      getAllAndOverride: () => ["inventory.read"],
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(createContext(["tasks.manage"]))).toBe(false);
  });
});

