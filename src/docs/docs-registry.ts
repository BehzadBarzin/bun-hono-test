import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

// A registry for the OpenAPI docs
// Register routes via `docsRegistry.registerPath(...)`
export const docsRegistry = new OpenAPIRegistry();

// =================================================================================================
// Enables swagger UI bearer authentication feature
// ⚠️ REMOVE THIS IF AUTH ISN'T AVAILABLE IN THIS API
export const docsBearerAuthComponent = docsRegistry.registerComponent(
  'securitySchemes',
  'bearerAuth',
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
);
