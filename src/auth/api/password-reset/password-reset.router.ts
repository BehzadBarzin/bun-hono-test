import { Hono } from 'hono';

import { zValidator } from '../../../middlewares/z-validator.middleware';

import { registerPasswordResetDocs } from './password-reset.docs';
import { PasswordResetService } from './password-reset.service';
import { forgotPasswordBodySchema } from './schemas/forgot-password-body.schema';
import { resetPasswordBodySchema } from './schemas/reset-password-body.schema';

/**
 * Creates a new Hono app instance with the entity-specific routes.
 *
 * @returns Hono app instance
 */
export function getPasswordResetRouter(): Hono {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const passwordResetService = new PasswordResetService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Forgot password
  router.post('/forgot-password', zValidator('json', forgotPasswordBodySchema), async (c) => {
    const body = c.req.valid('json');

    await passwordResetService.sendPasswordResetToken(body);

    return c.json({
      success: true,
      message: 'Password reset email sent',
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Reset password
  router.post('/reset-password', zValidator('json', resetPasswordBodySchema), async (c) => {
    const body = c.req.valid('json');

    const user = await passwordResetService.resetPassword(body);

    return c.json(user);
  });

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Register Docs
  registerPasswordResetDocs();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
