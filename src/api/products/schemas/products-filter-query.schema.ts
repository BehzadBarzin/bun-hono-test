import { z } from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination-query.schema";
import {
  ProductSelectSchema,
  ProductIncludeSchema,
  ProductWhereInputSchema,
  ProductScalarFieldEnumSchema,
} from "../../../../prisma/generated/zod";

import type { Prisma } from "@prisma/client";

// =================================================================================================
// Helpers
// =================================================================================================

export function getFindManyArgs(
  filterQuery: TProductsFilterQuery
): Prisma.ProductFindManyArgs {
  const findManyArgs: Prisma.ProductFindManyArgs = {
    orderBy: filterQuery.orderBy,
    skip: (filterQuery.page - 1) * filterQuery.size,
    take: filterQuery.size,
  };

  // Find many only accepts either `select` or `include`
  if (filterQuery.select) {
    findManyArgs.select = filterQuery.select;
  } else if (filterQuery.include) {
    findManyArgs.include = filterQuery.include;
  }

  if (filterQuery.where) {
    findManyArgs.where = filterQuery.where;
  }

  if (filterQuery.distinct) {
    findManyArgs.distinct = filterQuery.distinct;
  }

  return findManyArgs;
}

// =================================================================================================
// Schema
// =================================================================================================
// Validation schema
export const productsFilterQuerySchema = z
  .object({
    // ---------------------------------------------------------------------------------------------
    // Validation copied from `ProductFindManyArgsSchema` in `prisma/generated/zod/index.ts`
    distinct: z
      .union([
        ProductScalarFieldEnumSchema,
        ProductScalarFieldEnumSchema.array(),
      ])
      .optional(),
    // ---------------------------------------------------------------------------------------------
    select: ProductSelectSchema.optional(),
    // ---------------------------------------------------------------------------------------------
    include: ProductIncludeSchema.optional(),
    // ---------------------------------------------------------------------------------------------
    where: ProductWhereInputSchema.optional(),
    // ---------------------------------------------------------------------------------------------
  })
  // -----------------------------------------------------------------------------------------------
  // Merge with page query schema (orderBy, size, page)
  .merge(paginationQuerySchema)
  // -----------------------------------------------------------------------------------------------
  // Prisma only can accept either `select` or `include`
  .refine((v) => !(v.select && v.include), {
    message: "Query can only have either `select` or `include`",
  });

// Type of validated schema
export type TProductsFilterQuery = z.infer<typeof productsFilterQuerySchema>;
