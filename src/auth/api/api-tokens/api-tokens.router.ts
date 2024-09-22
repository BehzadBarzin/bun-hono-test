import { Hono } from 'hono';

import { idParamSchema } from '../../../common/schemas/id-param.schema';
import { paginationQuerySchema } from '../../../common/schemas/pagination-query.schema';
import { zValidator } from '../../../middlewares/z-validator.middleware';
import { UnauthenticatedException } from '../../exceptions/unauthenticated.exception';
import {
  authorize,
  type AuthHono,
  type AuthVariables,
} from '../../middlewares/authorize.middleware';

import { ApiTokensService } from './api-tokens.service';
import { issueTokenBodySchema } from './schemas/issue-token-body.schema';

/**
 * Creates a new Hono app instance with the entity-specific routes.
 *
 * @returns Hono app instance
 */
export function getApiTokensRouter(): AuthHono {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const apiTokensService = new ApiTokensService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono<{ Variables: AuthVariables }>();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Get all (of user)
  router.get(
    '/',
    authorize('apiTokens.getAllOfUser'),
    zValidator('query', paginationQuerySchema),
    async (c) => {
      // Get validated pagination query from the zValidator middleware
      const paginationQuery = c.req.valid('query');

      // Get authenticated user id attached by `authorize` middleware to context
      const userId = c.get('userId');
      if (!userId) {
        throw new UnauthenticatedException();
      }

      const apiTokens = await apiTokensService.getAllApiTokensOfUser(userId, paginationQuery);

      return c.json(apiTokens);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Get one
  router.get(
    '/:id',
    authorize('apiTokens.getById'),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const apiToken = await apiTokensService.getApiToken(id);

      return c.json(apiToken);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Create
  router.post(
    '/',
    authorize('apiTokens.issue'),
    zValidator('json', issueTokenBodySchema),
    async (c) => {
      const body = c.req.valid('json');

      // Get authenticated user id attached by `authorize` middleware to context
      const userId = c.get('userId');
      if (!userId) {
        throw new UnauthenticatedException();
      }

      const apiToken = await apiTokensService.issueToken(userId, body);

      return c.json(apiToken, 201);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Delete
  router.delete(
    '/:id',
    authorize('apiTokens.revoke'),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await apiTokensService.revokeToken(id);

      return c.json({ success: true });
    },
  );

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
