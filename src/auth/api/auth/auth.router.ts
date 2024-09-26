import { Hono } from 'hono';

import { zValidator } from '../../../middlewares/z-validator.middleware';
import { UnauthenticatedException } from '../../exceptions/unauthenticated.exception';
import {
  authorize,
  type AuthHono,
  type AuthVariables,
} from '../../middlewares/authorize.middleware';

import { registerAuthDocs } from './auth.docs';
import { AuthService } from './auth.service';
import { loginBodySchema } from './schemas/login-body.schema';
import { registerBodySchema } from './schemas/register-body.schema';

/**
 * Creates a new Hono app instance with the entity-specific routes.
 *
 * @returns Hono app instance
 */
export function getAuthRouter(): AuthHono {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const authService = new AuthService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono<{ Variables: AuthVariables }>();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Register
  router.post('/register', zValidator('json', registerBodySchema), async (c) => {
    const body = c.req.valid('json');

    const response = await authService.register(body);

    return c.json(response);
  });

  // -----------------------------------------------------------------------------------------------
  // Login
  router.post('/login', zValidator('json', loginBodySchema), async (c) => {
    const body = c.req.valid('json');

    const response = await authService.login(body);

    return c.json(response);
  });

  // -----------------------------------------------------------------------------------------------
  // Refresh token

  // Because we are using the refresh token in this route, we'll handle token
  // verification manually in the handler and not the authorize middleware
  router.get('/refresh', async (c) => {
    // Manually extract the refresh token from header
    const authHeader = c.req.header('authorization');
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthenticatedException();
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 && tokenParts[0] !== 'Bearer') {
      throw new UnauthenticatedException();
    }

    const token = tokenParts[1];

    const response = await authService.refresh(token);

    return c.json(response);
  });

  // -----------------------------------------------------------------------------------------------
  // Me
  router.get(
    '/me',
    authorize(), // Not passing permission action name will check ONLY for authentication
    async (c) => {
      // Get userId attached to context by `authorize` middleware
      const userId = c.get('userId');
      if (!userId) {
        throw new UnauthenticatedException();
      }

      const user = await authService.me(userId);

      return c.json(user);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Register Docs
  registerAuthDocs();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
