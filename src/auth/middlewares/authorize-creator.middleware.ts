import type { MiddlewareHandler } from 'hono/types';

import { idParamSchema } from '../../common/schemas/id-param.schema';
import { ValidationException } from '../../exceptions/validation.exception';
import { ForbiddenException } from '../exceptions/forbidden.exception';
import { UnauthenticatedException } from '../exceptions/unauthenticated.exception';
import { isSuperAdmin } from '../utils/is-super-admin';

import { authorize } from './authorize.middleware';

/**
 * A middleware function that checks if the authenticated user is the creator of the target entity.
 * Note: `super-admin` users are allowed in addition to the creator of the entity.
 * NOTE: This middleware internally calls `authorize` middleware and checks authentication, but permission-based authorization is skipped (no `action` is added to db and won't be checked).
 *
 * @param getEntityCreatorId - callback function to get entity creator id from db
 * @returns the middleware function
 */
export const authorizeCreator = (
  getEntityCreatorId: (entityId: number) => Promise<number>,
): MiddlewareHandler => {
  // -----------------------------------------------------------------------------------------------
  // Instantiate the `authorize` middleware
  const authorizeMiddleware = authorize();
  // -----------------------------------------------------------------------------------------------
  // Return the middleware function
  return async (c, next) => {
    // ---------------------------------------------------------------------------------------------
    // First, call `authorize` middleware to make sure user is authenticated and attach `userId` to context
    // NOTE: Passing an empty function as `next` so that the `authorize` middleware won't call `next` and continue
    await authorizeMiddleware(c, async () => {});
    // ---------------------------------------------------------------------------------------------
    // Get and validate :id path param
    const pathParams = c.req.param();
    const validatedPathParams = idParamSchema.safeParse(pathParams);
    if (!validatedPathParams.success) {
      throw new ValidationException('Bad Request', validatedPathParams.error);
    }
    // ---------------------------------------------------------------------------------------------
    // Get entity creator id from db via the given callback function
    const creatorId = await getEntityCreatorId(validatedPathParams.data.id);
    // ---------------------------------------------------------------------------------------------
    // Get authenticate user id from the request context (attached by `authorize` middleware)
    const userId = c.get('userId');
    if (!userId) {
      throw new UnauthenticatedException();
    }
    // ---------------------------------------------------------------------------------------------
    // Check if the authenticated user is the creator of the entity or if the user has `super-admin` role
    const isAdmin = await isSuperAdmin(userId);
    if (creatorId !== userId && !isAdmin) {
      console.log('here');
      throw new ForbiddenException();
    }
    // ---------------------------------------------------------------------------------------------
    await next();
    // ---------------------------------------------------------------------------------------------
  };
};
