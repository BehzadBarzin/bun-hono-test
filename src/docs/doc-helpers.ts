import type { RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z, type AnyZodObject } from 'zod';

import { paginationQuerySchema } from '../common/schemas/pagination-query.schema';

import { docsBearerAuthComponent, docsRegistry } from './docs-registry';

// =================================================================================================
type TRouteConfig = {
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  tag: string;
  summary?: string;
  description?: string;
  // ------------------------------------------
  // Request Configs
  requestJsonSchema?: AnyZodObject;
  requestParamsSchema?: AnyZodObject;
  acceptsFilterQuery?: boolean;
  requestHeadersSchema?: AnyZodObject;
  // ------------------------------------------
  // Response Configs
  successResponseCode?: '200' | '201' | '202' | '204';
  successResponseSchema?: AnyZodObject; // For both normal and paginated item responses
  returns400?: boolean;
  returns404?: boolean;
  // ------------------------------------------
  paginatedRoute?: boolean;
  authenticatedRoute?: boolean;
};

/**
 * Registers a route documentation in the registry.
 *
 * @param routeConfig route documentation config object
 */
export function registerRouteDoc(routeConfig: TRouteConfig) {
  // Set the default description to the method and path (e.g. GET /products)
  if (!routeConfig.description) {
    routeConfig.description = `${routeConfig.method.toUpperCase()} ${routeConfig.path}`;
  }

  const configs: RouteConfig = {
    method: routeConfig.method,
    path: routeConfig.path,
    description: routeConfig.description,
    tags: [routeConfig.tag],
    summary: routeConfig.summary,
    request: {},
    responses: {},
  };

  // Request Body
  if (routeConfig.requestJsonSchema) {
    configs.request = {
      ...configs.request,
      body: {
        content: {
          'application/json': {
            schema: routeConfig.requestJsonSchema,
          },
        },
      },
    };
  }

  // Request Params
  if (routeConfig.requestParamsSchema) {
    configs.request = {
      ...configs.request,
      params: routeConfig.requestParamsSchema,
    };
  }

  // Request Query: Pagination Query
  if (routeConfig.paginatedRoute) {
    configs.request = {
      ...configs.request,
      query: paginationQuerySchema,
    };
  }

  // Request Query: Filter Query
  if (routeConfig.acceptsFilterQuery) {
    configs.request = {
      ...configs.request,
      query: routeConfig.paginatedRoute
        ? paginationQuerySchema.merge(getFilterQuerySchema())
        : getFilterQuerySchema(),
    };
  }

  // Request Headers
  if (routeConfig.requestHeadersSchema) {
    configs.request = {
      ...configs.request,
      headers: routeConfig.requestHeadersSchema,
    };
  }

  // Set default success Response Code
  if (!routeConfig.successResponseCode) {
    routeConfig.successResponseCode = '200';
  }

  // Success Response
  if (routeConfig.successResponseSchema) {
    configs.responses[routeConfig.successResponseCode] = {
      description: 'Success',
      content: {
        'application/json': {
          schema: routeConfig.paginatedRoute
            ? getPaginatedResponseSchema(routeConfig.successResponseSchema)
            : routeConfig.successResponseSchema,
        },
      },
    };
  }

  // 400
  if (routeConfig.returns400) {
    configs.responses['400'] = get400ResponseDoc();
  }

  // 404
  if (routeConfig.returns404) {
    configs.responses['404'] = get404ResponseDoc();
  }

  // Authenticated Route
  if (routeConfig.authenticatedRoute) {
    // Enables swagger ui authentication for this route
    configs.security = [{ [docsBearerAuthComponent.name]: [] }];
    // Responses
    configs.responses['401'] = get401ResponseDoc();
    configs.responses['403'] = get403ResponseDoc();
  }

  // 500
  configs.responses['500'] = get500ResponseDoc();

  docsRegistry.registerPath(configs);
}

// =================================================================================================
// =================================================================================================
// Helper functions to return doc configs and zod schemas for different parts of the route config given to `registerPath`
// =================================================================================================
// Request
// =================================================================================================

// Returns the zod schema for the filter query (used in route config)
function getFilterQuerySchema() {
  return z.object({
    distinct: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .openapi({ examples: ['id', ['id', 'name']] }),
    select: z
      .object({})
      .optional()
      .openapi({ example: { id: true, name: true } }),
    include: z
      .object({})
      .optional()
      .openapi({ example: { info: true, posts: { likes: true } } }),
    where: z
      .object({})
      .optional()
      .openapi({
        example: {
          email: { endsWith: '@example.com' },
          posts: {
            some: {
              views: {
                gt: 10,
              },
            },
          },
        },
      }),
  });
}

// =================================================================================================
// Response
// =================================================================================================

// Returns the zod schema for the paginated response (used in route config)
function getPaginatedResponseSchema(itemZodSchema: AnyZodObject): AnyZodObject {
  return z.object({
    data: z.array(itemZodSchema),
    meta: z.object({
      count: z.number(),
      page: z.number(),
      totalPages: z.number(),
    }),
  });
}

// =================================================================================================
// Response Errors
// =================================================================================================

// Returns doc configs for 404 response
function get404ResponseDoc() {
  return {
    description: 'Not found',
    content: {
      'application/json': {
        // Returned by throwing `NotFoundException` class
        schema: z.object({
          error: z.object({
            status: z.number().openapi({ example: 404 }),
            message: z.string().openapi({ example: 'Not found' }),
          }),
        }),
      },
    },
  };
}

// -------------------------------------------------------------------------------------------------
// Returns doc configs for 500 response
function get500ResponseDoc() {
  return {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        // Returned when `onError` doesn't catch a known exception class
        // Based on returned response to user in server.ts `onError`
        schema: z.object({
          error: z.object({
            id: z.string().openapi({ example: 'b634aa92-6d42-4173-968d-d23812fd9d6e' }),
            status: z.number().openapi({ example: 500 }),
            message: z.string().openapi({ example: 'Internal Server Error' }),
            timestamp: z.string().openapi({ example: '2024-09-26T02:51:11.229Z' }),
            request: z.string().openapi({ example: '/api/users/1' }),
          }),
        }),
      },
    },
  };
}

// -------------------------------------------------------------------------------------------------
// Returns doc configs for 400 response
function get400ResponseDoc() {
  return {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: z.object({
          // Returned by throwing `ValidationException` and `BadRequestException` classes and handling it in `onError`
          // `error` schema based on serialized object returned by `ValidationException` and `BadRequestException` classes's `serializeErrors`
          error: z.object({
            status: z.number().openapi({ example: 400 }),
            message: z.string().openapi({ example: 'Bad Request' }),
            validationIssues: z
              .array(
                z.object({
                  path: z.string(),
                  message: z.string(),
                }),
              )
              .openapi({
                description: 'Only returns this array if there are validation issues',
                example: [
                  { path: 'info.name', message: 'Name is required' },
                  { path: 'password', message: 'Password must be at least 6 characters long' },
                ],
              }),
          }),
        }),
      },
    },
  };
}

// -------------------------------------------------------------------------------------------------
// Returns doc configs for 401 response
function get401ResponseDoc() {
  return {
    description: 'Unauthenticated',
    content: {
      'application/json': {
        // Returned by throwing `UnauthenticatedException` class and handling it in `onError`
        schema: z.object({
          error: z.object({
            status: z.number().openapi({ example: 401 }),
            message: z.string().openapi({ example: 'Unauthenticated' }),
          }),
        }),
      },
    },
  };
}

// -------------------------------------------------------------------------------------------------
// Returns doc configs for 403 response
function get403ResponseDoc() {
  return {
    description: 'Unauthenticated',
    content: {
      'application/json': {
        // Returned by throwing `ForbiddenException` class and handling it in `onError`
        schema: z.object({
          error: z.object({
            status: z.number().openapi({ example: 403 }),
            message: z.string().openapi({ example: 'Forbidden' }),
          }),
        }),
      },
    },
  };
}
