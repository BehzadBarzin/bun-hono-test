import { Hono } from "hono";

import { ProductsService } from "./products.service";

import { zValidator } from "../../middlewares/z-validator.middleware";

import { idParamSchema } from "../../common/schemas/id-param.schema";
import { createBodySchema } from "./schemas/create-body.schema";
import { updateBodySchema } from "./schemas/update-body.schema";

import { productsFilterQuerySchema } from "./schemas/products-filter-query.schema";
import { validateFilterQuery } from "../../middlewares/validate-filter-query.middleware";
import type { z } from "zod";

// -------------------------------------------------------------------------------------------------
/**
 * In the `validateFilterQuery` middleware, we validate the filter query with a "zod" schema.
 * Then attach the validated filter query to the request context.
 * We need to declare the type of `filterQuery` in the `Variables` type. And then use it in the
 * Hono<{ Variables: Variables }> type.
 * This way `filterQuery` variable would be type-safe.
 */
type Variables = {
  filterQuery: z.infer<typeof productsFilterQuerySchema>;
};

// -------------------------------------------------------------------------------------------------

/**
 * Creates a new Hono app instance with the entity-specific routes.
 *
 * @returns Hono app instance
 */
export function getProductsRouter(): Hono<{ Variables: Variables }> {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const productsService = new ProductsService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono<{ Variables: Variables }>();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Get all
  router.get("/", validateFilterQuery(productsFilterQuerySchema), async (c) => {
    // Get validated filter query from the request context (attached by `validateFilterQuery` middleware)
    const filterQuery = c.get("filterQuery");

    const products = await productsService.getProducts(filterQuery);

    return c.json(products);
  });

  // -----------------------------------------------------------------------------------------------
  // Get one
  router.get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const product = await productsService.getProduct(id);

    return c.json(product);
  });

  // -----------------------------------------------------------------------------------------------
  // Create
  router.post("/", zValidator("json", createBodySchema), async (c) => {
    const body = c.req.valid("json");
    const product = await productsService.createProduct(body);

    return c.json(product, 201);
  });

  // -----------------------------------------------------------------------------------------------
  // Update
  router.patch(
    "/:id",
    zValidator("param", idParamSchema),
    zValidator("json", updateBodySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const product = await productsService.updateProduct(id, body);
      return c.json(product);
    }
  );

  // -----------------------------------------------------------------------------------------------
  // Delete
  router.delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    await productsService.deleteProduct(id);

    return c.json({ success: true });
  });

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
