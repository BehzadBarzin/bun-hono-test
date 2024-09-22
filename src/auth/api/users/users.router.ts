import { Hono } from 'hono';

import { idParamSchema } from '../../../common/schemas/id-param.schema';
import { paginationQuerySchema } from '../../../common/schemas/pagination-query.schema';
import { zValidator } from '../../../middlewares/z-validator.middleware';
import {
  authorize,
  type AuthHono,
  type AuthVariables,
} from '../../middlewares/authorize.middleware';

import { createUserBodySchema } from './schemas/create-user-body.schema';
import { updateUserBodySchema } from './schemas/update-user-body.schema';
import { UsersService } from './users.service';

/**
 * Creates a new Hono app instance with the entity-specific routes.
 *
 * @returns Hono app instance
 */
export function getUsersRouter(): AuthHono {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const usersService = new UsersService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono<{ Variables: AuthVariables }>();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Get all
  router.get(
    '/',
    authorize('users.getAll'),
    zValidator('query', paginationQuerySchema),
    async (c) => {
      // Get validated pagination query from the zValidator middleware
      const paginationQuery = c.req.valid('query');

      const users = await usersService.getUsers(paginationQuery);

      return c.json(users);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Get one
  router.get('/:id', authorize('users.getById'), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const user = await usersService.getUser(id);

    return c.json(user);
  });

  // -----------------------------------------------------------------------------------------------
  // Create
  router.post(
    '/',
    authorize('users.create'),
    zValidator('json', createUserBodySchema),
    async (c) => {
      const body = c.req.valid('json');
      const user = await usersService.createUser(body);

      return c.json(user, 201);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Update
  router.patch(
    '/:id',
    authorize('users.update'),
    zValidator('param', idParamSchema),
    zValidator('json', updateUserBodySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      const user = await usersService.updateUser(id, body);

      return c.json(user);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Delete
  router.delete(
    '/:id',
    authorize('users.delete'),
    zValidator('param', idParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await usersService.deleteUser(id);

      return c.json({ success: true });
    },
  );

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
