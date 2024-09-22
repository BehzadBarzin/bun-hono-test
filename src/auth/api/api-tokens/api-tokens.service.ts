import { NotFoundException } from "../../../exceptions/not-found.exception";
import type { TIssueTokenBody } from "./schemas/issue-token-body.schema";

import type { TPaginatedResponse } from "../../../common/types/paginated-response.type";

import { type ApiToken } from "@prisma/client";
import { db } from "../../../utils/db";
import {
  getPaginatedResponseMeta,
  getPaginationFindManyArgs,
  type TPaginationQuery,
} from "../../../common/schemas/pagination-query.schema";
import { ForbiddenException } from "../../exceptions/forbidden.exception";
import { generateToken } from "../../utils/token";

export class ApiTokensService {
  // -----------------------------------------------------------------------------------------------
  // Get all
  async getAllApiTokensOfUser(
    userId: number,
    paginationQuery: TPaginationQuery
  ): Promise<TPaginatedResponse<ApiToken>> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user) {
      throw new NotFoundException();
    }

    // Check if user has super-admin role
    const isSuperAdmin: boolean = user.roles.some(
      (role) => role.name === "super-admin"
    );
    if (!isSuperAdmin) {
      throw new ForbiddenException();
    }

    const findManyArgs = getPaginationFindManyArgs(paginationQuery);
    const apiTokens = await db.apiToken.findMany({
      ...findManyArgs,
      where: { user: { id: userId } },
    });

    const count = await db.apiToken.aggregate({
      _count: true,
      where: { user: { id: userId } },
    });

    return {
      // Obscure all tokens
      data: apiTokens.map((apiToken) => this.obscureToken(apiToken)),
      meta: getPaginatedResponseMeta(
        count._count,
        paginationQuery.page,
        paginationQuery.size
      ),
    };
  }

  // -----------------------------------------------------------------------------------------------
  // Get one
  async getApiToken(id: number): Promise<ApiToken> {
    const apiToken = await db.apiToken.findUnique({ where: { id } });

    if (!apiToken) {
      throw new NotFoundException();
    }

    return this.obscureToken(apiToken);
  }

  // -----------------------------------------------------------------------------------------------
  // Issue token
  async issueToken(userId: number, body: TIssueTokenBody): Promise<ApiToken> {
    // Get user from DB
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user) {
      throw new NotFoundException();
    }

    // User must be super-admin
    const isSuperAdmin: boolean = user.roles.some(
      (role) => role.name === "super-admin"
    );
    if (!isSuperAdmin) {
      throw new ForbiddenException();
    }

    // Generate a random token
    const token = generateToken(256);

    const newToken = await db.apiToken.create({
      data: {
        ...body,
        token: token,
        user: { connect: { id: user.id } },
      },
    });

    return newToken;
  }

  // -----------------------------------------------------------------------------------------------
  // Revoke token
  async revokeToken(id: number): Promise<ApiToken> {
    const apiTokenToDelete = await db.apiToken.findFirst({ where: { id } });
    if (!apiTokenToDelete) {
      throw new NotFoundException();
    }

    const deletedApiToken = await db.apiToken.delete({
      where: { id },
    });

    return this.obscureToken(deletedApiToken);
  }

  // -----------------------------------------------------------------------------------------------
  // Utility
  // -----------------------------------------------------------------------------------------------
  /**
   * Utility function to obscure the token field of the ApiToken DB entity
   * It replaces the token field characters with '*' except for the first 4 and last 4 characters
   */
  obscureToken(apiToken: ApiToken): ApiToken {
    const obscuredToken =
      apiToken.token.slice(0, 3) +
      "*".repeat(apiToken.token.length - 8) +
      apiToken.token.slice(-4);
    return {
      ...apiToken,
      token: obscuredToken,
    };
  }
  // -----------------------------------------------------------------------------------------------
}
