import { Hono } from "hono";

import { getApiTokensRouter } from "./api-tokens/api-tokens.router";
import { getAuthRouter } from "./auth/auth.router";
import { getPasswordResetRouter } from "./password-reset/password-reset.router";
import { getPermissionsRouter } from "./permissions/permissions.router";
import { getRolesRouter } from "./roles/roles.router";
import { getUsersRouter } from "./users/users.router";

// -------------------------------------------------------------------------------------------------
// Instantiate a new Hono app instance to use as a router
const authRouter = new Hono();

// -------------------------------------------------------------------------------------------------
// Register entity-specific routes

authRouter.route("/", getAuthRouter());
authRouter.route("/users", getUsersRouter());
authRouter.route("/", getPasswordResetRouter());
authRouter.route("/roles", getRolesRouter());
authRouter.route("/permissions", getPermissionsRouter());
authRouter.route("/api-tokens", getApiTokensRouter());

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
export default authRouter;
