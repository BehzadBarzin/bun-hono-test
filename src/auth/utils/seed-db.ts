import type { Permission, Role, User } from "@prisma/client";

import { db } from "../../utils/db";

import { generateHash } from "./password";
import { configs } from "../../configs";
import { EProviders } from "../enums/providers.enum";

export async function seedAuthDB(): Promise<void> {
  // ---------------------------------------------------------------------------
  // Find or Create Roles
  const superAdminRole = await db.role.upsert({
    where: {
      name: "super-admin",
    },
    update: {},
    create: {
      name: "super-admin",
      description: "Super Admin Role",
    },
    include: {
      permissions: true,
    },
  });

  const authenticatedRole = await db.role.upsert({
    where: {
      name: "authenticated",
    },
    update: {},
    create: {
      name: "authenticated",
      description: "Authenticated User Role",
    },
    include: {
      permissions: true,
    },
  });

  // ---------------------------------------------------------------------------
  // Find or Create Super Admin User
  const superAdminUser = await db.user.upsert({
    where: {
      email: configs.auth.SUPER_ADMIN_EMAIL,
    },
    update: {},
    create: {
      email: configs.auth.SUPER_ADMIN_EMAIL,
      password: await generateHash(configs.auth.SUPER_ADMIN_PASSWORD),
      provider: EProviders.local,
      roles: {
        connect: [
          {
            id: superAdminRole.id,
          },
          {
            id: authenticatedRole.id,
          },
        ],
      },
    },
  });

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Add all permissions to the super-admin role
  const permissions: Permission[] = await db.permission.findMany();

  for (const permission of permissions) {
    // If permission → role doesn't exist, add it
    const hasPermission: boolean =
      superAdminRole.permissions.some((p) => p.action === permission.action) ||
      false;

    if (!hasPermission) {
      await db.role.update({
        where: {
          id: superAdminRole.id,
        },
        data: {
          permissions: {
            connect: {
              id: permission.id,
            },
          },
        },
      });
    }
  }
  // ---------------------------------------------------------------------------
}

// =============================================================================
