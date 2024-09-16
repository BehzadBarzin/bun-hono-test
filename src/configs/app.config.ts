import { z } from "zod";
import type { Environment } from ".";

export const appConfigSchema = z.object({
  PORT: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().default(3000)),
});

export const getAppConfig = (env: Environment) => {
  // Return the object referenced by 'configs.app'
  return {
    port: env.PORT,
  };
};
