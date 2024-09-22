import { Hono } from 'hono';

import { idParamSchema } from '../../../common/schemas/id-param.schema';
import { paginationQuerySchema } from '../../../common/schemas/pagination-query.schema';
import { zValidator } from '../../../middlewares/z-validator.middleware';
import {
  authorize,
  type AuthHono,
  type AuthVariables,
} from '../../middlewares/authorize.middleware';

import { PermissionsService } from './permissions.service';

/**
 * Creates a new Hono app instance with the entity-specific routes.
 *
 * @returns Hono app instance
 */
export function getPermissionsRouter(): AuthHono {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const permissionsService = new PermissionsService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono<{ Variables: AuthVariables }>();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Get all
  router.get(
    '/',
    authorize('permissions.getAll'),
    zValidator('query', paginationQuerySchema),
    async (c) => {
      // Get validated pagination query from the zValidator middleware
      const paginationQuery = c.req.valid('query');

      const permissions = await permissionsService.getPermissions(paginationQuery);

      return c.json(permissions);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Get one
  router.get(
    '/:id',
    authorize('permissions.getById'),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const permission = await permissionsService.getPermission(id);

      return c.json(permission);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
