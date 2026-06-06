import { SetMetadata } from "@nestjs/common";

export const MODULE_KEY = "moduleKey";

export const RequiresModule = (moduleKey: string) =>
  SetMetadata(MODULE_KEY, moduleKey);

