import { describe, test, expect, beforeAll, afterAll, beforeEach, mock, jest } from 'bun:test';
import type { MiddlewareHandler } from 'hono';
import qs from 'qs';

import { NotFoundException } from '../../exceptions/not-found.exception.ts';
import { mockModule } from '../../test-utils/module-mocker';

import { getProductsRouter } from './products.router';
import type { TCreateProductBody } from './schemas/create-product-body.schema.ts';
import type { TUpdateProductBody } from './schemas/update-product-body.schema.ts';

// =================================================================================================
// Mock of all ProductsService class methods in a single object to be able to spy on them and mock their result
const mockProductsService = {
  getProducts: mock(),
  getProduct: mock(),
  createProduct: mock(),
  updateProduct: mock(),
  deleteProduct: mock(),
};

// Mock the `ProductsService` module by defining a new in-line class with the mock methods to replace it where it is imported in the router
// NOTE: By mocking the module, when the router imports it, it will use the mock instead of the real implementation
const clearProductsServiceMock = await mockModule('../api/products/products.service.ts', () => {
  // Mock export for `products.service.ts` module
  return {
    // Replaces: `export class ProductsService {...}`
    ProductsService: class {
      getProducts = mockProductsService.getProducts;
      getProduct = mockProductsService.getProduct;
      createProduct = mockProductsService.createProduct;
      updateProduct = mockProductsService.updateProduct;
      deleteProduct = mockProductsService.deleteProduct;
    },
  };
});

// =================================================================================================
// Mock `authorize` middleware

// Replace the returned function from the `authorize.middleware.ts` module with a mock function to modify the implementation
// that just sets the `userId` in the request context to `1`
const clearAuthorizeMock = await mockModule('../auth/middlewares/authorize.middleware.ts', () => ({
  // Mock the `authorize` named export of the module
  authorize: (action?: string): MiddlewareHandler => {
    return async (c, next) => {
      // Manually set the `userId` in the request context, assumes user is logged in with this id
      c.set('userId', 1);
      await next();
    };
  },
}));

// =================================================================================================
// Mock the onError of the router to catch any unhandled errors

/**
 * Why we need this?
 * Here, we're testing a specific router (not the main app). In the `app` we have a `onError` that
 * catches any unhandled errors and returns a response with proper status and body. But in the router we don't have a `onError`.
 *
 * For example: Let's say an endpoint throws a validation error, in the `app` instance it returns a 400
 * and we could assert the status code. But, in the router it will throw an error and wouldn't return a response at all.
 */
const mockOnError = mock((error, c) => {
  // Return response (NOTE: we are returning a 200 response, so don't try to assert the status code)
  // Instead, assert the call to this mock onError function and assert the type of the error object passed in.
  return c.json({ error: true });
});

/**
TESTING `app`:
                                +-----------+                                                                                          
 return { ... } | status: 400---|  onError  |  -------------------------------------|                                                  
                                +-----------+                                       |                                                  
                                      |                                             |                                                  
                              +-------|-------+        +---------------+            |                                                  
                              |               |        |               |            |                                                  
(START) POST /api/products----|       app     |--------|     router    |  THROWS ValidationError                                       
                              |               |        |               |                                                               
                              +---------------+        +---------------+                                                               
                                                                                                                                      
---------------------
TESTING `router`:
                                                                                               
                                                                                                                                       
                                                                                                                                       
                                                    +----------------+                                                                    
         return { error: true } | status: 200  ------  mock onError  |-----Spy on when it's called                                        
                                                    +----------------+     INSPECT the type of error passed to it                         
                                                             |                                                                            
                                                             |                                                                            
                               +---------------+             |                                                                            
                               |               |             |                                                                            
(START) POST /api/products-----|     router    |  THROWS ValidationError                                                                  
                               |               |                                                                                          
                               +---------------+                                                                                          
                                                                                                                                      

 */
// =================================================================================================

describe('ProductsRouter', () => {
  // -----------------------------------------------------------------------------------------------
  // Initialization
  // -----------------------------------------------------------------------------------------------
  let productsRouter: ReturnType<typeof getProductsRouter>;

  // -----------------------------------------------------------------------------------------------
  // Before all
  // -----------------------------------------------------------------------------------------------
  beforeAll(async () => {
    // ---------------------------------------------------------------------------------------------
    // Create the router
    productsRouter = getProductsRouter();
    // Set up onError to catch any unhandled errors with a mock function that we later can verify
    productsRouter.onError(mockOnError);
    // ---------------------------------------------------------------------------------------------
  });

  // -----------------------------------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------------------------------
  afterAll(async () => {
    // Clear all mocks
    mock.restore();
    // Clear all module mocks
    clearProductsServiceMock();
    clearAuthorizeMock();
    // ---------------------------------------------------------------------------------------------
  });

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // GET /
  // -----------------------------------------------------------------------------------------------
  describe('GET /', () => {
    // ---------------------------------------------------------------------------------------------
    test('should return products', async () => {
      // Arrange: Set up mock data
      const mockServiceResponse = {
        data: [
          {
            id: 1,
            name: 'Product 1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            price: 10,
            userId: 1,
          },
        ],
        meta: {
          count: 1,
          page: 1,
          totalPages: 10,
        },
      };
      // Setup mock response from service (when router calls this method it will return mock response)
      mockProductsService.getProducts.mockResolvedValue(mockServiceResponse);

      // Act: Make a GET request to the products endpoint
      const response = await productsRouter.request('/', { method: 'GET' });

      // Assert: Verify the response contains the expected data
      expect(mockProductsService.getProducts).toHaveBeenCalled();
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual(mockServiceResponse);
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail with invalid query params', async () => {
      // Arrange: Set up mock data
      const query = {
        page: 1,
        size: 10,
        include: {
          ABC: true,
        },
      };
      const parsedQuery = qs.stringify(query);

      // Act: Make a GET request to the products endpoint
      const response = await productsRouter.request(`?${parsedQuery}`, { method: 'GET' });
      const data = await response.json();

      // Assert: Verify the response contains the expected data
      // Expect mock onError to be called with the error object (first arg) containing `statusCode=400` (defined in `BadRequestException` class)
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
        expect.anything(),
      );

      // Expect the response we have returned from the mock onError function defined above
      expect(data).toEqual({ error: true });
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // GET /:id
  // -----------------------------------------------------------------------------------------------
  describe('GET /:id', () => {
    // ---------------------------------------------------------------------------------------------
    test('should return a product', async () => {
      // Arrange: Set up mock data
      const mockServiceResponse = {
        id: 1,
        name: 'Product 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        price: 10,
        userId: 1,
      };
      // Setup mock response from service (when router calls this method it will return mock response)
      mockProductsService.getProduct.mockResolvedValue(mockServiceResponse);

      // Act: Make a GET request to the products endpoint
      const response = await productsRouter.request('/1', { method: 'GET' });
      const data = await response.json();

      // Assert: Verify the response contains the expected data
      expect(mockProductsService.getProduct).toHaveBeenCalledWith(1);

      expect(response.status).toBe(200);

      expect(data).toEqual(mockServiceResponse);
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail if product is not found', async () => {
      // Arrange: Set up mock data
      // Should throw exception
      mockProductsService.getProduct.mockRejectedValue(new NotFoundException());

      // Act: Make a GET request to the products endpoint
      const response = await productsRouter.request('/1', { method: 'GET' });
      const data = await response.json();

      // Assert: Verify the response contains the expected data
      expect(mockProductsService.getProduct).toHaveBeenCalledWith(1);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
        expect.anything(),
      );
      expect(data).toEqual({ error: true });
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail if :id path parameter is not a number', async () => {
      // Arrange: Set up mock data

      // Act: Make a GET request to the products endpoint
      const response = await productsRouter.request('/xxx', { method: 'GET' });
      const data = await response.json();

      // Assert: Verify the response contains the expected data
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
        expect.anything(),
      );
      expect(data).toEqual({ error: true });
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // POST /
  // -----------------------------------------------------------------------------------------------
  describe('POST /', () => {
    // ---------------------------------------------------------------------------------------------
    test('should call products service create method with correct params and return its response', async () => {
      // Arrange: Set up mock data
      const body: TCreateProductBody = {
        name: 'Product 7',
        price: 70,
      };
      // userId is set via the mock `authorize` middleware above and assumes user is logged in
      // mock authorize: c.set('userId', 1);
      // router: c.get('userId');
      // So we expect createProduct in the service to be called with 1
      const userId = 1;

      // Setup mock response from service (when router calls this method it will return this mock response)
      mockProductsService.createProduct.mockResolvedValue({
        id: 7,
        name: 'Product 7',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        price: 70,
        userId: 1,
      });

      // Act: Make a POST request to the products endpoint
      const response = await productsRouter.request('/', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: new Headers({ 'Content-Type': 'application/json' }), // ⚠️ This is required. otherwise, in the router c.req.json() / c.req.valid('json') would be undefined
      });

      // Assert: Verify the response contains the expected data
      expect(mockProductsService.createProduct).toHaveBeenCalledWith(userId, body);
      expect(response.status).toBe(201);
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail with invalid body', async () => {
      // Arrange: Set up mock data
      const body = {
        name: 'Product 7',
        price: 'xxx',
      };
      // userId is set via the mock `authorize` middleware above and assumes user is logged in
      const userId = 1;

      // Act: Make a POST request to the products endpoint
      const response = await productsRouter.request('/', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: new Headers({ 'Content-Type': 'application/json' }), // ⚠️ This is required.
      });
      const data = await response.json();

      // Assert: Verify the response contains the expected data
      // Expect mock onError to be called with the error object (first arg) containing `statusCode=400` (defined in `BadRequestException` class)
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
        expect.anything(),
      );
      expect(data).toEqual({ error: true });
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // PATCH /:id
  // -----------------------------------------------------------------------------------------------
  describe('PATCH /:id', () => {
    // ---------------------------------------------------------------------------------------------
    test.skip('should call products service update method with correct params and return its response', async () => {
      // Arrange: Set up mock data
      const productId = 7;
      const userId = 1;
      const body: TUpdateProductBody = {
        price: 11,
      };

      // Setup mock response from service (when router calls this method it will return this mock response)
      const mockServiceResponse = {
        id: productId,
        name: 'Product 7',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        price: 11,
        userId: 1,
      };
      mockProductsService.updateProduct.mockResolvedValue(mockServiceResponse);

      // Act: Make a PATCH request to the products endpoint
      const response = await productsRouter.request(`/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: new Headers({ 'Content-Type': 'application/json' }), // ⚠️ This is required.
      });

      const data = await response.json();

      // Assert: Verify the response contains the expected data
      expect(mockProductsService.updateProduct).toHaveBeenCalledWith(productId, userId, body);
      expect(data).toEqual(mockServiceResponse);
      expect(response.status).toBe(200);
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail with invalid body', async () => {
      // Arrange: Set up mock data
      const productId = 7;
      const userId = 1;
      const body = {
        price: 'xxx',
      };

      // Act: Make a PATCH request to the products endpoint
      const response = await productsRouter.request(`/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: new Headers({ 'Content-Type': 'application/json' }), // ⚠️ This is required.
      });
      const data = await response.json();

      // Assert: Verify the response contains the expected data
      // Expect mock onError to be called with the error object (first arg) containing `statusCode=400` (defined in `BadRequestException` class)
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
        expect.anything(),
      );
      expect(data).toEqual({ error: true });
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // DELETE /:id
  // -----------------------------------------------------------------------------------------------
  describe('DELETE /:id', () => {
    // ---------------------------------------------------------------------------------------------
    test.skip('should call products service delete method with correct params', async () => {
      // Arrange: Set up mock data
      const productId = 7;
      const userId = 1;

      // Act: Make a DELETE request to the products endpoint
      const response = await productsRouter.request(`/${productId}`, {
        method: 'DELETE',
      });

      // Assert: Verify the response contains the expected data
      expect(mockProductsService.deleteProduct).toHaveBeenCalledWith(productId, userId);
      expect(response.status).toBe(200);
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
});
