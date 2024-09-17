import { Hono } from "hono";

import { ProductsService } from "./products.service";

import { zValidator } from "../../middlewares/z-validator.middleware";

import { idParamSchema } from "./schemas/id-param.schema";
import { createBodySchema } from "./schemas/create-body.schema";
import { updateBodySchema } from "./schemas/update-body.schema";

/**
 * Creates a new Hono app instance with the entity-specific routes.
 *
 * @returns Hono app instance
 */
export function getProductsRouter(): Hono {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const productsService = new ProductsService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Get all
  router.get("/", async (c) => {
    const products = await productsService.getProducts();

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

    return c.status(204);
  });

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
