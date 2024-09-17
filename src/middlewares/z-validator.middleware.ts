/**
 * Copied from https://github.com/honojs/middleware/tree/main/packages/zod-validator
 *
 * Just modified error handling to throw our custom exception and not return response to user.
 */
import type {
  Context,
  MiddlewareHandler,
  Env,
  ValidationTargets,
  TypedResponse,
  Input,
} from "hono";
import { validator } from "hono/validator";
import type { z, ZodSchema, ZodError } from "zod";
import { ValidationException } from "../exceptions/validation.exception";

export type Hook<T, E extends Env, P extends string, O = {}> = (
  result:
    | { success: true; data: T }
    | { success: false; error: ZodError; data: T },
  c: Context<E, P>
) =>
  | Response
  | void
  | TypedResponse<O>
  | Promise<Response | void | TypedResponse<O>>;

type HasUndefined<T> = undefined extends T ? true : false;

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  In = z.input<T>,
  Out = z.output<T>,
  I extends Input = {
    in: HasUndefined<In> extends true
      ? {
          [K in Target]?: K extends "json"
            ? In
            : HasUndefined<keyof ValidationTargets[K]> extends true
            ? { [K2 in keyof In]?: ValidationTargets[K][K2] }
            : { [K2 in keyof In]: ValidationTargets[K][K2] };
        }
      : {
          [K in Target]: K extends "json"
            ? In
            : HasUndefined<keyof ValidationTargets[K]> extends true
            ? { [K2 in keyof In]?: ValidationTargets[K][K2] }
            : { [K2 in keyof In]: ValidationTargets[K][K2] };
        };
    out: { [K in Target]: Out };
  },
  V extends I = I
>(
  target: Target,
  schema: T,
  hook?: Hook<z.infer<T>, E, P>
): MiddlewareHandler<E, P, V> =>
  // @ts-expect-error not typed well
  validator(target, async (value, c) => {
    const result = await schema.safeParseAsync(value);

    if (hook) {
      const hookResult = await hook({ data: value, ...result }, c);
      if (hookResult) {
        if (hookResult instanceof Response) {
          return hookResult;
        }

        if ("response" in hookResult) {
          return hookResult.response;
        }
      }
    }

    if (!result.success) {
      // ⭐Note: Modified here
      throw new ValidationException("Bad Request", result.error);
      // return c.json(result, 400);
    }

    return result.data as z.infer<T>;
  });
