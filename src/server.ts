import './docs/extend-zod';
import { swaggerUI } from '@hono/swagger-ui';
import { Prisma } from '@prisma/client';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { logger as honoLogger } from 'hono/logger';
import { v4 as UUID } from 'uuid';
import { ZodError } from 'zod';

import apiRouter from './api';
import authRouter from './auth/api';
import { seedAuthDB } from './auth/utils/seed-db';
import { configs } from './configs';
import { generateDocsJson } from './docs/generate-docs-json';
import { BaseException } from './exceptions/base.exception';
import { NotFoundException } from './exceptions/not-found.exception';
import { ValidationException } from './exceptions/validation.exception';
import { logger } from './utils/logger';
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Hono App
export const app = new Hono({
  strict: false, // app.get('/hello') will match both "GET /hello/" and "GET /hello"
});

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Setup Logger
app.use(
  honoLogger((message: string, ...rest: string[]) => {
    // Logs once before handling request, and then after handling and prints status and time taken to process request.
    logger.verbose(message, ...rest);
  }),
);

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Serve static files from /public directory
app.get(
  '*',
  serveStatic({
    root: 'public',
    onFound(path, c) {
      // Called when the file is found. We can set Cache-Control headers here.
      // c.header("Cache-Control", `public, immutable, max-age=31536000`);
    },
  }),
);

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Error Handling

// Catch all unhandled exceptions in the app
app.onError((err, c) => {
  // If the error is an instance of one of our custom BaseException classes, return the serialized error object
  if (err instanceof BaseException) {
    return c.json({ error: err.serializeErrors() }, err.statusCode);
  }

  // Some Prisma query options are directly passed from query-strings
  // If there's an error with Prisma (invalid field names) or any other problem, we catch it here
  // and return a valid (correct format) Validation Exception to user via the ValidationException class
  if (err instanceof Prisma.PrismaClientValidationError) {
    const newError = new ValidationException('Invalid Query', new ZodError([]));
    return c.json({ error: newError.serializeErrors() }, newError.statusCode);
  }

  // For unknown exceptions, return a 500 response
  const errorResponse = {
    id: UUID(), // Return a unique identifier for this error to be able to debug it from logs
    status: 500,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    request: c.req.path,
  };

  // Log the error response sent to client and the error details for debugging
  logger.error(err.message, err);

  return c.json({ error: errorResponse }, 500);
});

// -------------------------------------------------------------------------------------------------
// Customize 404 error to throw our custom exception class that would then be caught by `onError` above
app.notFound((c) => {
  throw new NotFoundException();
});

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Routes
app.get('/', (c) => c.text('Hello World!'));

// Register Auth routes
app.route('/auth', authRouter);

// Register API routes
app.route('/api', apiRouter);

// -------------------------------------------------------------------------------------------------
logger.info(`⚡️Server running on ${configs.app.host}:${configs.app.port}`);
// -------------------------------------------------------------------------------------------------
// Seed DB with Auth data
await seedAuthDB();
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// OpenAPI + SwaggerUI
await generateDocsJson(); // Generate docs and save to /public/docs.json
// Use the middleware to serve Swagger UI at /docs
app.get(
  '/docs',
  swaggerUI({
    url: '/docs.json',
    persistAuthorization: true,
    docExpansion: 'none', // Collapse all groups
  }),
);
logger.info(`✅SwaggerUI served at ${configs.app.host}:${configs.app.port}/docs`);
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
export default {
  port: configs.app.port,
  fetch: app.fetch,
};
