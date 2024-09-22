import { NotFoundException } from "../../../exceptions/not-found.exception";
import type { TCreateUserBody } from "./schemas/create-user-body.schema";
import type { TUpdateUserBody } from "./schemas/update-user-body.schema";

import type { TPaginatedResponse } from "../../../common/types/paginated-response.type";

import { type User } from "@prisma/client";
import { db } from "../../../utils/db";
import {
  getPaginatedResponseMeta,
  getPaginationFindManyArgs,
  type TPaginationQuery,
} from "../../../common/schemas/pagination-query.schema";
import { configs } from "../../../configs";
import { BadRequestException } from "../../../exceptions/bad-request.exception";
import { generateHash } from "../../utils/password";
import { EProviders } from "../../enums/providers.enum";

// =================================================================================================

export type CleanUser = Omit<
  User,
  "password" | "resetPasswordToken" | "confirmationToken"
>;

// =================================================================================================

export class UsersService {
  // -----------------------------------------------------------------------------------------------
  // Get all
  async getUsers(
    paginationQuery: TPaginationQuery
  ): Promise<TPaginatedResponse<CleanUser>> {
    const findManyArgs = getPaginationFindManyArgs(paginationQuery);
    const users = await db.user.findMany(findManyArgs);

    const count = await db.user.aggregate({
      _count: true,
    });

    return {
      // Clean users
      data: users.map((user) => this.cleanUser(user)),
      meta: getPaginatedResponseMeta(
        count._count,
        paginationQuery.page,
        paginationQuery.size
      ),
    };
  }

  // -----------------------------------------------------------------------------------------------
  // Get one
  async getUser(id: number): Promise<CleanUser> {
    const user = await db.user.findFirst({ where: { id } });
    if (!user) {
      throw new NotFoundException();
    }

    return this.cleanUser(user);
  }

  // -----------------------------------------------------------------------------------------------
  // Create
  async createUser(body: TCreateUserBody): Promise<CleanUser> {
    // Check if email is already in use
    const existingUser = await db.user.findFirst({
      where: { email: body.email },
    });
    if (existingUser) {
      throw new BadRequestException("Email already in use");
    }

    // Find the default "authenticated" role from DB
    const defaultRole = await db.role.findFirst({
      where: { name: "authenticated" },
    });
    if (!defaultRole) {
      throw new Error(
        'Default "authenticated" role not found when creating a user'
      );
    }

    // User Role connections
    const userRoles = body.roles?.map((roleId) => ({ id: roleId })) || [];
    // If default "authenticated" role isn't set, add it to the list
    if (!userRoles.find((role) => role.id === defaultRole.id)) {
      userRoles.push({ id: defaultRole.id });
    }
    delete body.roles;

    // Create new User
    const newUser = await db.user.create({
      data: {
        ...body,
        password: await generateHash(body.password!),
        roles: {
          connect: userRoles,
        },
        provider: EProviders.local,
      },
    });

    return this.cleanUser(newUser);
  }

  // -----------------------------------------------------------------------------------------------
  // Update
  async updateUser(id: number, body: TUpdateUserBody): Promise<CleanUser> {
    const user = await db.user.findUnique({
      where: { id },
      include: { roles: { select: { id: true } } },
    });
    if (!user) {
      throw new NotFoundException();
    }

    // Cannot update user's sensitive fields
    // if (body.password || body.email || body.provider) {
    //   throw new BadRequestException("Cannot update user's sensitive fields");
    // }

    let userRoles: { id: number }[] = [];
    // If roles are being updated
    if (body.roles) {
      // Find the default "authenticated" role from DB
      const defaultRole = await db.role.findFirst({
        where: { name: "authenticated" },
      });
      if (!defaultRole) {
        throw new Error('Default "authenticated" role not found');
      }

      // If update data doesn't have the default role, throw error
      if (!body.roles.includes(defaultRole.id)) {
        throw new BadRequestException("Default role cannot be removed");
      }

      // Update User Role connections
      userRoles = body.roles?.map((roleId) => ({ id: roleId })) || [];
      delete body.roles;
    }

    // Merge the existing product with the new data
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...body,
        roles: {
          // If roles are not provided in body, keep the current roles
          set: userRoles.length ? userRoles : user.roles,
        },
      },
    });

    return this.cleanUser(updatedUser);
  }
  // -----------------------------------------------------------------------------------------------
  // Delete
  async deleteUser(id: number): Promise<void> {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException();
    }

    // If it is the default super-admin user, throw an error
    if (user.email === configs.auth.SUPER_ADMIN_EMAIL) {
      throw new BadRequestException(
        'Cannot delete the default "super-admin" user'
      );
    }

    await db.user.delete({ where: { id } });
  }

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  async getUserByEmail(
    email: string,
    includePassword: boolean = false
  ): Promise<CleanUser | User> {
    const user = await db.user.findFirst({ where: { email } });
    if (!user) {
      throw new NotFoundException();
    }

    return includePassword ? user : this.cleanUser(user);
  }

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  /**
   * Utility function to get User entity from DB as input and returns the user without sensitive fields.
   */
  cleanUser(user: User): CleanUser {
    return {
      id: user.id,
      email: user.email,
      provider: user.provider,
      confirmed: user.confirmed,
      blocked: user.blocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // -----------------------------------------------------------------------------------------------
}
