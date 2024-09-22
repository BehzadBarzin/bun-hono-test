import type { MiddlewareHandler } from 'hono/types';
import qs from 'qs';
import type { z } from 'zod';

import { ValidationException } from '../exceptions/validation.exception';

// =================================================================================================
// Utility
// =================================================================================================
function isNumber(val: string) {
  return !isNaN(parseFloat(val));
}

function isBoolean(val: string) {
  return val === 'false' || val === 'true';
}

// =================================================================================================
// Middleware
// =================================================================================================

/**
 * Generate a new middleware handler to parse, and validate the filter query with a "zod" schema.
 *
 * @param zodSchema - zod schema to validate the filter query
 * @returns a new middleware handler to parse, and validate the filter query
 */
export const validateFilterQuery = (zodSchema: z.ZodSchema): MiddlewareHandler => {
  // Returns a new middleware handler
  return async (c, next) => {
    // ---------------------------------------------------------------------------------------------
    // Parse the raw request query string with "qs" to a plain object
    const rawQueryString = c.req.url.split('?')[1] || '';
    const parsedQuery = qs.parse(rawQueryString, {
      // By default 'qs' parses every value to string, so we override its decoder to parse numbers and booleans
      decoder(str, defaultDecoder, charset, type) {
        // Parse number
        if (isNumber(str)) {
          return Number(str);
        }
        // Parse boolean
        if (isBoolean(str)) {
          return str === 'true';
        }
        // Default decoder
        return defaultDecoder(str, charset, type);
      },
    });
    // ---------------------------------------------------------------------------------------------
    // Validate the query object with "zod"
    const result = await zodSchema.safeParseAsync(parsedQuery);

    if (!result.success) {
      throw new ValidationException('Bad Request', result.error);
    }
    // ---------------------------------------------------------------------------------------------
    // Set the validated query to the context as "filterQuery" variable
    c.set('filterQuery', result.data);
    // ---------------------------------------------------------------------------------------------
    // Continue
    await next();
    // ---------------------------------------------------------------------------------------------
  };
};
