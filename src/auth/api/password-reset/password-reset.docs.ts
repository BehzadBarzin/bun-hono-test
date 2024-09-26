import { z } from 'zod';

import { UserSchema } from '../../../../prisma/generated/zod';
import { registerRouteDoc } from '../../../docs/doc-helpers';

import { forgotPasswordBodySchema } from './schemas/forgot-password-body.schema';
import { resetPasswordBodySchema } from './schemas/reset-password-body.schema';

// The base path for this router
const basePath = '/password-reset';
// Group of routes
const tag = 'Password Reset';

// =================================================================================================

/**
 * Register docs for this router
 */
export function registerPasswordResetDocs() {
  // -----------------------------------------------------------------------------------------------
  // POST /forgot-password
  registerRouteDoc({
    method: 'post',
    path: `${basePath}/forgot-password`,
    description: 'Send password reset email',
    tag,
    requestJsonSchema: forgotPasswordBodySchema,
    successResponseSchema: z.object({
      success: z.boolean().openapi({ example: true }),
      message: z.string().openapi({ example: 'Password reset email sent' }),
    }),
    returns400: true, // Invalid body
  });
  // -----------------------------------------------------------------------------------------------
  // POST /reset-password
  registerRouteDoc({
    method: 'post',
    path: `${basePath}/reset-password`,
    description: 'Reset password',
    tag,
    requestJsonSchema: resetPasswordBodySchema,
    successResponseSchema: UserSchema.omit({ password: true }),
    returns400: true, // Invalid body or expired token
  });
}
