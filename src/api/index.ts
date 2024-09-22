import { Hono } from 'hono';

import { getProductsRouter } from './products/products.router';

// -------------------------------------------------------------------------------------------------
// Instantiate a new Hono app instance to use as a router
const apiRouter = new Hono();

// -------------------------------------------------------------------------------------------------
// Register entity-specific routes

apiRouter.route('/products', getProductsRouter());

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
export default apiRouter;
