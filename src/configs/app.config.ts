import { z } from "zod";
import type { Environment } from ".";

export const appConfigSchema = z.object({
  PORT: z
    .string()
    .default("3000")
    .transform((v) => Number(v))
    .pipe(z.number()),
});

export const getAppConfig = (env: Environment) => {
  // Return the object referenced by 'configs.app'
  return {
    port: env.PORT,
  };
};
