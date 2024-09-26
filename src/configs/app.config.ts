import { z } from 'zod';

import type { Environment } from '.';

// -------------------------------------------------------------------------------------------------
// Validation schema for environment variables relevant to this group
export const appConfigSchema = z.object({
  PORT: z
    .string()
    .default('3000')
    .transform((v) => Number(v))
    .pipe(z.number().min(1111).max(65535)),
  HOST: z
    .string()
    .url()
    .default('http://localhost')
    .transform((v) => {
      // remove trailing slash
      return v.replace(/\/$/, '');
    }),
  APP_NAME: z.string().default('API'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_DESCRIPTION: z.string().default('Demo API'),
});

// -------------------------------------------------------------------------------------------------
// Extract environment variables from the validated (flat) `env` object and group them into a relevant nested config object
export const getAppConfig = (env: Environment) => {
  // Return the object referenced by the nested config object in 'configs.app'
  return {
    port: env.PORT,
    host: env.HOST,
    name: env.APP_NAME,
    version: env.APP_VERSION,
    description: env.APP_DESCRIPTION,
  };
};
