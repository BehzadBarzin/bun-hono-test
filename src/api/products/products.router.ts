import { Hono } from 'hono';
import type { z } from 'zod';

import {
  authorize,
  type AuthHono,
  type AuthVariables,
} from '../../auth/middlewares/authorize.middleware';
import { idParamSchema } from '../../common/schemas/id-param.schema';
import { validateFilterQuery } from '../../middlewares/validate-filter-query.middleware';
import { zValidator } from '../../middlewares/z-validator.middleware';

import { ProductsService } from './products.service';
import { createProductBodySchema } from './schemas/create-product-body.schema';
import { productsFilterQuerySchema } from './schemas/products-filter-query.schema';
import { updateProductBodySchema } from './schemas/update-product-body.schema';

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
export function getProductsRouter(): Hono<{ Variables: Variables & AuthVariables }> {
  // -----------------------------------------------------------------------------------------------
  // Initialize service
  const productsService = new ProductsService();
  // -----------------------------------------------------------------------------------------------
  // Instantiate a new Hono app to use as a router
  const router = new Hono<{ Variables: Variables & AuthVariables }>();
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // Get all
  router.get('/', validateFilterQuery(productsFilterQuerySchema), async (c) => {
    // Get validated filter query from the request context (attached by `validateFilterQuery` middleware)
    const filterQuery = c.get('filterQuery');

    const products = await productsService.getProducts(filterQuery);

    return c.json(products);
  });

  // -----------------------------------------------------------------------------------------------
  // Get one
  router.get('/:id', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const product = await productsService.getProduct(id);

    return c.json(product);
  });

  // -----------------------------------------------------------------------------------------------
  // Create
  router.post(
    '/',
    authorize('products.create'),
    zValidator('json', createProductBodySchema),
    async (c) => {
      const body = c.req.valid('json');

      // Get userId attached by `authorize` middleware to context
      const userId = c.get('userId');

      const product = await productsService.createProduct(userId!, body);

      return c.json(product, 201);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Update
  router.patch(
    '/:id',
    authorize(),
    zValidator('param', idParamSchema),
    zValidator('json', updateProductBodySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      // Get userId attached by `authorize` middleware to context
      const userId = c.get('userId');

      const product = await productsService.updateProduct(id, userId!, body);
      return c.json(product);
    },
  );

  // -----------------------------------------------------------------------------------------------
  // Delete
  router.delete('/:id', authorize(), zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');

    // Get userId attached by `authorize` middleware to context
    const userId = c.get('userId');

    await productsService.deleteProduct(id, userId!);

    return c.json({ success: true });
  });

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  return router;
}
