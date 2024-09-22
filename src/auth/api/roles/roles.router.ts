import { Hono } from 'hono';

import { idParamSchema } from '../../../common/schemas/id-param.schema';
import { paginationQuerySchema } from '../../../common/schemas/pagination-query.schema';
import { zValidator } from '../../../middlewares/z-validator.middleware';
import {
  authorize,
  type AuthHono,
  type AuthVariables,
} from '../../middlewares/authorize.middleware';

import { RolesService } from './roles.service';
import { createRoleBodySchema } from './schemas/create-role-body.schema';
import { updateRoleBodySchema } from './schemas/update-role-body.schema';

/**
 * Creates a new Hono app instance with the entity-specific routes.
 *
 * @returns Hono app instance
 */
export function getRolesRouter(): AuthHono {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const rolesService = new RolesService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono<{ Variables: AuthVariables }>();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Get all
  router.get(
    '/',
    authorize('roles.getAll'),
    zValidator('query', paginationQuerySchema),
    async (c) => {
      // Get validated pagination query from the zValidator middleware
      const paginationQuery = c.req.valid('query');

      const roles = await rolesService.getRoles(paginationQuery);

      return c.json(roles);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Get one
  router.get('/:id', authorize('roles.getById'), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const role = await rolesService.getRole(id);

    return c.json(role);
  });

  // -----------------------------------------------------------------------------------------------
  // Create
  router.post(
    '/',
    authorize('roles.create'),
    zValidator('json', createRoleBodySchema),
    async (c) => {
      const body = c.req.valid('json');
      const role = await rolesService.createRole(body);

      return c.json(role, 201);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Update
  router.patch(
    '/:id',
    authorize('roles.update'),
    zValidator('param', idParamSchema),
    zValidator('json', updateRoleBodySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      const role = await rolesService.updateRole(id, body);

      return c.json(role);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Delete
  router.delete(
    '/:id',
    authorize('roles.delete'),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await rolesService.deleteRole(id);

      return c.json({ success: true });
    },
  );

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
