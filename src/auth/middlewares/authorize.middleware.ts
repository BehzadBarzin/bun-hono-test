import { ForbiddenException } from "../exceptions/forbidden.exception";
import { UnauthenticatedException } from "../exceptions/unauthenticated.exception";
import { isJWT, type JwtPayload, verifyAccessToken } from "../utils/jwt";
import { db } from "../../utils/db";
import type { Hono, MiddlewareHandler } from "hono";

// -------------------------------------------------------------------------------------------------
/**
 * In the `authorize` middleware, we authenticate the request with a JWT token.
 * Then attach the `userId` and `token` to the request context.
 * We need to declare the type of these variables in the `Variables` type. And then use it in the
 * Hono<{ Variables: Variables }> type.
 * This way `c.get("userId")` and `c.get("token")` variables would be type-safe.
 */
export type AuthVariables = {
  userId?: number;
  token?: string;
};

/**
 * Use this type for routers that use the `authorize` middleware.
 */
export type AuthHono = Hono<{ Variables: AuthVariables }>;

// -------------------------------------------------------------------------------------------------
/**
 * First registers action in the database.
 * Then, creates and returns a middleware function that authorizes a request.
 * the `action` parameter is optional.
 *
 * - If the `action` parameter is provided, the middleware function will check if the user has the permission to perform the action.
 * - If `action` is not provided the middleware will just check if the user is authenticated.
 *
 * @param action - The action name to be authorized
 */
export const authorize = (action?: string): MiddlewareHandler => {
  // -----------------------------------------------------------------------------------------------
  // If actionName is provided, authorization is required
  if (action) {
    // Check to see if the action permission doesn't exist in the database, create it.
    db.permission
      .upsert({
        where: {
          action: action,
        },
        update: {},
        create: {
          action: action,
        },
      })
      .then(() => {});
  }
  // -----------------------------------------------------------------------------------------------
  // Returns the middleware function
  return async (c, next) => {
    // ---------------------------------------------------------------------------------------------
    // Extract JWT from header
    const authHeader = c.req.header("authorization");
    if (!authHeader || typeof authHeader !== "string") {
      throw new UnauthenticatedException();
    }

    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 && tokenParts[0] !== "Bearer") {
      throw new UnauthenticatedException();
    }

    const token = tokenParts[1];
    // -------------------------------------------------------------------------
    if (isJWT(token)) {
      // -----------------------------------------------------------------------
      // If token is JWT, use user authentication
      // -----------------------------------------------------------------------
      // Verify JWT
      const payload: JwtPayload | null = verifyAccessToken(token);

      // If payload is null, token is either expired or invalid
      if (!payload || !payload.sub) {
        throw new UnauthenticatedException();
      }

      // -----------------------------------------------------------------------
      // Find user in database (populate roles and permissions)
      const user = await db.user.findUnique({
        where: { id: Number(payload.sub) },
        include: {
          roles: {
            include: { permissions: true },
          },
        },
      });

      if (!user) {
        throw new UnauthenticatedException();
      }
      // -----------------------------------------------------------------------
      // Attach userId to request context
      c.set("userId", user.id);
      c.set("token", token);
      // -----------------------------------------------------------------------
      // If an action is provided, check if the user has the required permission
      // This way, if no action is provided it means that we're just checking if the user is authenticated
      if (action) {
        // Check if any of user's roles has the target permission
        const hasPermission: boolean = user.roles.some((role) => {
          return role.permissions.some((permission) => {
            return permission.action === action;
          });
        });

        if (!hasPermission) {
          throw new ForbiddenException();
        }
      }

      // -----------------------------------------------------------------------
    } else {
      // -----------------------------------------------------------------------
      // If token is not JWT, it must be a valid api token access key
      // -----------------------------------------------------------------------
      // Find api token from DB
      const apiToken = await db.apiToken.findFirst({
        where: { token: token, expiresAt: { gte: new Date() } },
        include: { permissions: true },
      });

      if (!apiToken) {
        throw new UnauthenticatedException();
      }

      // -----------------------------------------------------------------------
      // Attach userId of the api token's creator to the request object
      c.set("userId", apiToken.userId);
      // -----------------------------------------------------------------------
      // If an action is provided, check if the api token has the required permission
      if (action) {
        // If api token isn't fullAccess, check to see if the api token has permission
        if (!apiToken.fullAccess) {
          const hasPermission: boolean = apiToken.permissions.some(
            (permission) => {
              return permission.action === action;
            }
          );

          if (!hasPermission) {
            throw new ForbiddenException();
          }
        }
      }
      // -----------------------------------------------------------------------
    }
    // -------------------------------------------------------------------------
    await next();
  };
};
