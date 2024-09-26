import { z } from 'zod';

import { UserSchema } from '../../../../prisma/generated/zod';
import { registerRouteDoc } from '../../../docs/doc-helpers';

import { loginBodySchema } from './schemas/login-body.schema';
import { registerBodySchema } from './schemas/register-body.schema';

// The base path for this router
const basePath = '/auth';
// Group of routes
const tag = 'Auth';

// =================================================================================================
// Auth Tokens Response Schema
const authTokensResponseSchema = z.object({
  user: UserSchema.omit({ password: true }),
  accessToken: z.object({
    token: z.string().openapi({
      example: 'eyJhbGciOiJIU...Jf36POk6yJVadQssw5c',
    }),
    issuedAt: z.number().openapi({ example: 1667116800000 }),
    expiresAt: z.number().openapi({ example: 1667203200000 }),
  }),
  refreshToken: z.object({
    token: z.string().openapi({
      example: 'eyJhbGciOiJIU...Jf36POk6yJVadQssw5c',
    }),
    issuedAt: z.number().openapi({ example: 1667116800000 }),
    expiresAt: z.number().openapi({ example: 1667203200000 }),
  }),
});
// =================================================================================================

/**
 * Register docs for this router
 */
export function registerAuthDocs() {
  // -----------------------------------------------------------------------------------------------
  // POST /register
  registerRouteDoc({
    method: 'post',
    path: `${basePath}/register`,
    description: 'Register a new user',
    tag,
    requestJsonSchema: registerBodySchema,
    successResponseSchema: authTokensResponseSchema,
    returns400: true,
  });

  // -----------------------------------------------------------------------------------------------
  // POST /login
  registerRouteDoc({
    method: 'post',
    path: `${basePath}/login`,
    description: 'Login a user',
    tag,
    requestJsonSchema: loginBodySchema,
    successResponseSchema: authTokensResponseSchema,
    returns400: true,
  });

  // -----------------------------------------------------------------------------------------------
  // GET /refresh
  registerRouteDoc({
    method: 'get',
    path: `${basePath}/refresh`,
    description: 'Refresh the access token',
    tag,
    successResponseSchema: authTokensResponseSchema,
    requestHeadersSchema: z.object({
      Authorization: z.string().openapi({ example: 'Bearer eyJhbGciOiJIU...Jf36POk6yJVadQssw5c' }),
    }),
  });
  // -----------------------------------------------------------------------------------------------
  // GET /me
  registerRouteDoc({
    method: 'get',
    path: `${basePath}/me`,
    description: 'Get the current user',
    tag,
    successResponseSchema: UserSchema.omit({ password: true }),
    authenticatedRoute: true,
  });
}
