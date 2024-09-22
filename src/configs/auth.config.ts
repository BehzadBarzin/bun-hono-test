import { z } from 'zod';

import type { Environment } from '.';

// -------------------------------------------------------------------------------------------------
// Validation schema for environment variables relevant to this group
export const authConfigSchema = z.object({
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: z.string().default('5m'),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: z.string().default('7d'),
  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_SECRET: z.string(),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string(),
  PASSWORD_RESET_TOKEN_EXPIRATION_TIME: z.string().default('20m'),
});

// -------------------------------------------------------------------------------------------------
// Extract environment variables from the validated (flat) `env` object and group them into a relevant nested config object
export const getAuthConfig = (env: Environment) => {
  // Return the object referenced by the nested config object in 'configs.app'
  return {
    JWT_ACCESS_TOKEN_EXPIRATION_TIME: env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
    JWT_REFRESH_TOKEN_EXPIRATION_TIME: env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
    JWT_ACCESS_TOKEN_SECRET: env.JWT_ACCESS_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_SECRET: env.JWT_REFRESH_TOKEN_SECRET,
    SUPER_ADMIN_EMAIL: env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: env.SUPER_ADMIN_PASSWORD,
    PASSWORD_RESET_TOKEN_EXPIRATION_TIME: env.PASSWORD_RESET_TOKEN_EXPIRATION_TIME,
  };
};
