import { NotFoundException } from "../../../exceptions/not-found.exception";
import type { TCreateRoleBody } from "./schemas/create-role-body.schema";
import type { TUpdateRoleBody } from "./schemas/update-role-body.schema";

import type { TPaginatedResponse } from "../../../common/types/paginated-response.type";

import { type Role } from "@prisma/client";
import { db } from "../../../utils/db";
import {
  getPaginatedResponseMeta,
  getPaginationFindManyArgs,
  type TPaginationQuery,
} from "../../../common/schemas/pagination-query.schema";

export class RolesService {
  // -----------------------------------------------------------------------------------------------
  // Get all
  async getRoles(
    paginationQuery: TPaginationQuery
  ): Promise<TPaginatedResponse<Role>> {
    const findManyArgs = getPaginationFindManyArgs(paginationQuery);
    const roles = await db.role.findMany(findManyArgs);

    const count = await db.role.aggregate({
      _count: true,
    });

    return {
      data: roles,
      meta: getPaginatedResponseMeta(
        count._count,
        paginationQuery.page,
        paginationQuery.size
      ),
    };
  }

  // -----------------------------------------------------------------------------------------------
  // Get one
  async getRole(id: number): Promise<Role> {
    const role = await db.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException();
    }

    return role;
  }

  // -----------------------------------------------------------------------------------------------
  // Create
  async createRole(body: TCreateRoleBody): Promise<Role> {
    const rolePermissions: { id: number }[] =
      body.permissions?.map((permissionId) => ({ id: permissionId })) || [];
    delete body.permissions;

    const newRole = await db.role.create({
      data: {
        ...body,
        permissions: {
          connect: rolePermissions,
        },
      },
    });
    return newRole;
  }

  // -----------------------------------------------------------------------------------------------
  // Update
  async updateRole(id: number, body: TUpdateRoleBody): Promise<Role> {
    const roleToUpdate = await db.role.findFirst({
      where: { id },
      include: { permissions: { select: { id: true } } },
    });
    if (!roleToUpdate) {
      throw new NotFoundException();
    }

    // Start by using existing permissions
    let rolePermissions: { id: number }[] = roleToUpdate.permissions;
    // If permissions are being updated
    if (body.permissions) {
      // Override Role Permission connections
      rolePermissions = body.permissions.map((permissionId) => ({
        id: permissionId,
      }));
      delete body.permissions;
    }

    // Merge the existing role with the new data
    const updatedRole = await db.role.update({
      where: { id },
      data: {
        ...body,
        permissions: {
          set: rolePermissions,
        },
      },
    });

    return updatedRole;
  }
  // -----------------------------------------------------------------------------------------------
  // Delete
  async deleteRole(id: number): Promise<void> {
    const role = await db.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException();
    }

    await db.role.delete({ where: { id } });
  }

  // -----------------------------------------------------------------------------------------------
}
