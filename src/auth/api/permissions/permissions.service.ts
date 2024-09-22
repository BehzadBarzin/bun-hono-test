import type { Permission } from '@prisma/client';

import {
  getPaginatedResponseMeta,
  getPaginationFindManyArgs,
  type TPaginationQuery,
} from '../../../common/schemas/pagination-query.schema';
import type { TPaginatedResponse } from '../../../common/types/paginated-response.type';
import { NotFoundException } from '../../../exceptions/not-found.exception';
import { db } from '../../../utils/db';

export class PermissionsService {
  // -----------------------------------------------------------------------------------------------
  // Get all
  async getPermissions(paginationQuery: TPaginationQuery): Promise<TPaginatedResponse<Permission>> {
    const findManyArgs = getPaginationFindManyArgs(paginationQuery);
    const permissions = await db.permission.findMany(findManyArgs);

    const count = await db.permission.aggregate({
      _count: true,
    });

    return {
      data: permissions,
      meta: getPaginatedResponseMeta(count._count, paginationQuery.page, paginationQuery.size),
    };
  }

  // -----------------------------------------------------------------------------------------------
  // Get one
  async getPermission(id: number): Promise<Permission> {
    const permission = await db.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException();
    }

    return permission;
  }

  // -----------------------------------------------------------------------------------------------
}
