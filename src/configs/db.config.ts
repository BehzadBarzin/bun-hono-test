import { z } from 'zod';

import type { Environment } from '.';

// -------------------------------------------------------------------------------------------------
// Validation schema for environment variables relevant to this group
export const dbConfigSchema = z.object({
  DATABASE_URL: z.string().url(),
});

// -------------------------------------------------------------------------------------------------
// Extract environment variables from the validated (flat) `env` object and group them into a relevant nested config object
export const getDBConfig = (env: Environment) => {
  // Return the object referenced by the nested config object in 'configs.app'
  return {
    DATABASE_URL: env.DATABASE_URL,
  };
};
