import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

import { appConfigSchema, getAppConfig } from './app.config';
import { authConfigSchema, getAuthConfig } from './auth.config';
import { dbConfigSchema, getDBConfig } from './db.config';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Load appropriate .env file based on NODE_ENV
const envFileMap: Record<string, string> = {
  production: '.env.prod',
  development: '.env.dev',
  test: '.env.test',
};

const NODE_ENV = process.env.NODE_ENV || 'development'; // default to development
const ENV_FILE = envFileMap[NODE_ENV] || '.env.dev'; // fallback to .env.dev if something unexpected

// Load env file
dotenvConfig({ path: ENV_FILE });

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Define the schema for environment variables using Zod
// 1️⃣⭐ merge different groups' config schemas (from ./xyz.config.ts files)
const envSchema = z.object({}).merge(appConfigSchema).merge(dbConfigSchema).merge(authConfigSchema);

// Type of the flat environment variables
export type Environment = z.infer<typeof envSchema>;

// Parse and validate the environment variables (all variables are in a single flat object)
const env = envSchema.safeParse(process.env);

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// If validation fails
if (!env.success) {
  console.log('❌ There is an error with the environment variable validation!');
  // Construct a more readable array of issues
  const issues = env.error.issues.map((issue) => {
    return [issue.path.join('.'), issue.message];
  });

  console.error(issues);
  process.exit(1);
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Export the validated environment variables nested in different config groups
// This step only groups the environment variables in relevant config objects
// 2️⃣⭐ Call each group's function to extract its environment variables into a single object (from ./xyz.config.ts files)
export const configs = {
  app: getAppConfig(env.data),
  db: getDBConfig(env.data),
  auth: getAuthConfig(env.data),
};

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
console.log(`⚙️ Loaded environment from ${ENV_FILE}`);
