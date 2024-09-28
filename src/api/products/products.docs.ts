import { ProductSchema } from '../../../prisma/generated/zod';
import { idParamSchema } from '../../common/schemas/id-param.schema';
import { registerRouteDoc } from '../../docs/doc-helpers';

import { createProductBodySchema } from './schemas/create-product-body.schema';
import { updateProductBodySchema } from './schemas/update-product-body.schema';

// The base path for this router
const basePath = '/api/products';
// Group of routes
const tag = 'Products';

/**
 * Register docs for this router
 */
export function registerProductsDocs() {
  // -----------------------------------------------------------------------------------------------
  // GET /
  registerRouteDoc({
    method: 'get',
    path: `${basePath}`,
    description: 'Get all products',
    tag,
    requestJsonSchema: createProductBodySchema,
    successResponseSchema: ProductSchema,
    paginatedRoute: true,
    acceptsFilterQuery: true,
    returns400: true,
  });
  // -----------------------------------------------------------------------------------------------
  // POST /
  registerRouteDoc({
    method: 'post',
    path: `${basePath}`,
    description: 'Create a new product',
    tag,
    requestJsonSchema: createProductBodySchema, // Request body
    successResponseCode: '201', // Success Code
    successResponseSchema: ProductSchema, // Returns the created product
    returns400: true, // Invalid body
    authenticatedRoute: true, // Requires authentication
  });
  // -----------------------------------------------------------------------------------------------
  // GET /:id
  registerRouteDoc({
    method: 'get',
    path: `${basePath}/:id`,
    description: 'Get a product by id',
    tag,
    requestParamsSchema: idParamSchema, // Accepts :id param
    successResponseSchema: ProductSchema, // Returns the product
    returns400: true, // Invalid :id param
    returns404: true, // Product not found
  });
  // -----------------------------------------------------------------------------------------------
  // PATCH /:id
  registerRouteDoc({
    method: 'patch',
    path: `${basePath}/:id`,
    description: 'Update a product by id',
    tag,
    requestParamsSchema: idParamSchema, // Accepts :id param
    requestJsonSchema: updateProductBodySchema, // Request body
    successResponseSchema: ProductSchema, // Returns the updated product
    returns400: true, // Invalid body or :id param
    returns404: true, // Product not found
    authenticatedRoute: true, // Requires authentication
  });
  // -----------------------------------------------------------------------------------------------
  // DELETE /:id
  registerRouteDoc({
    method: 'delete',
    path: `${basePath}/:id`,
    description: 'Delete a product by id',
    tag,
    requestParamsSchema: idParamSchema, // Accepts :id param
    returns400: true, // Invalid :id param
    returns404: true, // Product not found
    authenticatedRoute: true, // Requires authentication
  });
}
