import { config as dotenvConfig } from "dotenv";
import { z } from "zod";
import { appConfigSchema, getAppConfig } from "./app.config";

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Load appropriate .env file based on NODE_ENV
const envFileMap: Record<string, string> = {
  production: ".env.prod",
  development: ".env.dev",
  test: ".env.test",
};

const NODE_ENV = process.env.NODE_ENV || "development"; // default to development
const ENV_FILE = envFileMap[NODE_ENV] || ".env.dev"; // fallback to .env.dev if something unexpected

dotenvConfig({ path: ENV_FILE });

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Define the schema for environment variables using Zod (merge different config schemas)
const envSchema = z.object({}).merge(appConfigSchema);

// Type of the environment variables
export type Environment = z.infer<typeof envSchema>;

// Parse and validate the environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.log("❌ There is an error with the environment variable validation!");
  console.error(env.error.issues);
  process.exit(1);
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// ⭐ Export the validated environment variables nested in different config objects
export const configs = {
  app: getAppConfig(env.data),
};

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
console.log(`⚙️ Loaded environment from ${ENV_FILE}`);
