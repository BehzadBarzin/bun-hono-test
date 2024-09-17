import { configs } from "./configs";

import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import apiRouter from "./api";

import { BaseException } from "./exceptions/base.exception";
import { NotFoundException } from "./exceptions/not-found.exception";

import { v4 as UUID } from "uuid";

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Hono App
const app = new Hono({
  strict: false, // app.get('/hello') will match both "GET /hello/" and "GET /hello"
});

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Serve static files from /public directory
app.get(
  "*",
  serveStatic({
    root: "public",
    onFound(path, c) {
      // Called when the file is found. We can set Cache-Control headers here.
      // c.header("Cache-Control", `public, immutable, max-age=31536000`);
    },
  })
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

  // For unknown exceptions, return a 500 response
  const errorResponse = {
    id: UUID(), // Return a unique identifier for this error to be able to debug it from logs
    status: 500,
    message: "Internal Server Error",
    timestamp: new Date().toISOString(),
    request: c.req.path,
  };

  // Log the error response sent to client and the error details for debugging
  console.log("-".repeat(100));
  console.error(errorResponse);
  console.error(err.message);
  console.log(err.stack);
  console.log("-".repeat(100));

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
app.get("/", (c) => c.text("Hello World!"));

// Register API routes
app.route("/api", apiRouter);

// -------------------------------------------------------------------------------------------------
console.log(`⚡️Server running on ${configs.app.host}:${configs.app.port}`);
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
export default {
  port: configs.app.port,
  fetch: app.fetch,
};
