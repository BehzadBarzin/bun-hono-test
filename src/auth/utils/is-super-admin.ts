import { db } from '../../utils/db';
import { UnauthenticatedException } from '../exceptions/unauthenticated.exception';

/**
 * Checks
 *
 * @param userId - The user id to check
 * @returns true if the user has the `super-admin` role
 */
export async function isSuperAdmin(userId: number) {
  const user = await db.user.findUnique({ where: { id: userId }, include: { roles: true } });

  if (!user) {
    throw new UnauthenticatedException();
  }

  return user.roles.some((role) => role.name === 'super-admin');
}
