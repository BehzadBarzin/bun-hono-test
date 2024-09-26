import { z } from 'zod';

import type { TPaginatedResponseMeta } from '../types/paginated-response.type';

// =================================================================================================
// Helpers
// =================================================================================================
/**
 * Creates `meta` object to be sent back to the client
 *
 * @param count total number of items
 * @param page current page number
 * @param size items per page
 * @returns `meta` object to be sent back to the client
 */
export function getPaginatedResponseMeta(
  count: number,
  page: number,
  size: number,
): TPaginatedResponseMeta {
  return {
    count,
    page,
    totalPages: Math.ceil(count / size),
  };
}

/**
 * Creates `findMany` arguments object from the request's filter query
 *
 * @param paginationQuery - pagination filter query object from the request
 * @returns pagination parameters for `findMany`
 */
export function getPaginationFindManyArgs(paginationQuery: TPaginationQuery) {
  const findManyArgs = {
    orderBy: paginationQuery.orderBy,
    skip: (paginationQuery.page - 1) * paginationQuery.size,
    take: paginationQuery.size,
  };

  return findManyArgs;
}

// =================================================================================================
// Utility
// =================================================================================================

/**
 *
 * @param v string[] - ["id:asc", "price:asc"]
 * @returns - [{ id: "asc" }, { price: "asc" }]
 */
const transformOrderBy = (v: string[]) => {
  const orderBy: Record<string, 'asc' | 'desc'>[] = [];

  v.forEach((item) => {
    const [field, direction] = item.split(':');
    if (direction === 'asc' || direction === 'desc') {
      orderBy.push({ [field]: direction }); // Add field and direction to the array
    }
  });

  return orderBy;
};

// =================================================================================================
// Schema
// =================================================================================================
// Validation schema
export const paginationQuerySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  // orderBy: "name:asc,price:desc",
  orderBy: z
    .string()
    .transform((v) =>
      v
        .replace(/\s/g, '') // Remove whitespace
        .split(',')
        .filter((i) => i !== ''),
    )
    .pipe(z.array(z.string()).transform(transformOrderBy))
    .optional()
    .openapi({ example: 'name:asc,price:desc' }),
  // -----------------------------------------------------------------------------------------------
  // size (page size): 20
  size: z
    .union([z.string(), z.number()])
    .default('20')
    .transform((v) => Number(v))
    .pipe(z.number().min(1)),
  // -----------------------------------------------------------------------------------------------
  // page (current page): 1
  page: z
    .union([z.string(), z.number()])
    .default('1')
    .transform((v) => Number(v))
    .pipe(z.number().min(1)),
  // -----------------------------------------------------------------------------------------------
});

// Type of validated schema
export type TPaginationQuery = z.infer<typeof paginationQuerySchema>;
