import { Prisma, type Product, type User } from '@prisma/client';
import { describe, test, expect, beforeAll, afterAll, mock, jest } from 'bun:test';

import { EProviders } from '../../auth/enums/providers.enum';
import { ForbiddenException } from '../../auth/exceptions/forbidden.exception';
import { NotFoundException } from '../../exceptions/not-found.exception';
import { mockModule } from '../../test-utils/module-mocker';
import { db } from '../../utils/db';

import { ProductsService } from './products.service';
import type { TProductsFilterQuery } from './schemas/products-filter-query.schema';

// =================================================================================================
// Mock the isSuperAdmin function by mocking its module export.
// Now, we can manually return true or false.

// First, create a mock function to be able to spy on and mock its return value
const isSuperAdminMock = mock();

// Then, mock the export of the module by returning the mock function defined above instead of the real function
const clearIsSuperAdminMock = await mockModule('../auth/utils/is-super-admin.ts', () => {
  // The mock export
  return {
    isSuperAdmin: isSuperAdminMock,
  };
});

// =================================================================================================

describe('ProductsService', () => {
  // -----------------------------------------------------------------------------------------------
  // Initialization
  // -----------------------------------------------------------------------------------------------
  let productsService: ProductsService;
  let users: User[];
  let products: Product[];

  // -----------------------------------------------------------------------------------------------
  // Before all
  // -----------------------------------------------------------------------------------------------
  beforeAll(async () => {
    // ---------------------------------------------------------------------------------------------
    // Initialize product service
    productsService = new ProductsService();
    // ---------------------------------------------------------------------------------------------
    // Create users in database
    users = await db.user.createManyAndReturn({
      data: [
        {
          email: `a@email.com`,
          password: '123',
          provider: EProviders.local,
        },
        {
          email: 'b@email.com',
          password: '123',
          provider: EProviders.local,
        },
      ],
    });
    // ---------------------------------------------------------------------------------------------
    // Create products in database
    products = await db.product.createManyAndReturn({
      data: [
        { name: 'Product 1', price: 10, userId: users[0].id },
        { name: 'Product 2', price: 20, userId: users[0].id },
        { name: 'Product 3', price: 30, userId: users[0].id },
        { name: 'Product 4', price: 40, userId: users[1].id },
        { name: 'Product 5', price: 50, userId: users[1].id },
        { name: 'Product 6', price: 60, userId: users[1].id },
      ],
    });
    // ---------------------------------------------------------------------------------------------
  });

  // -----------------------------------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------------------------------
  afterAll(async () => {
    // Clear all mocks
    mock.restore();
    // Clear all module mocks
    clearIsSuperAdminMock();
    // ---------------------------------------------------------------------------------------------
    // Reset database
    // Make sure to await db operations not to have conflicts with other test files
    await db.product.deleteMany({
      where: {
        id: {
          in: products.map((product) => product.id),
        },
      },
    });
    await db.user.deleteMany({
      where: {
        id: {
          in: users.map((user) => user.id),
        },
      },
    });
    // ---------------------------------------------------------------------------------------------
  });

  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
  // getProducts
  // -----------------------------------------------------------------------------------------------
  describe('getProducts', () => {
    // ---------------------------------------------------------------------------------------------
    test('should return paginated products', async () => {
      // Arrange: Setup mock data and responses
      const filterQuery: TProductsFilterQuery = {
        page: 1, // Current page
        size: 2, // Products per page
      };

      const expectedResponse = {
        data: products.slice(0, filterQuery.size),
        meta: {
          count: products.length,
          page: filterQuery.page,
          totalPages: Math.ceil(products.length / filterQuery.size),
        },
      };

      // Act: Call the getProducts method with a filter query
      const result = await productsService.getProducts(filterQuery);

      // Assert: Verify the response matches the expected data
      expect(result).toEqual(expectedResponse);
    });

    // ---------------------------------------------------------------------------------------------
    test('should filter products and populate user', async () => {
      // Arrange: Setup mock data and responses
      const filterQuery: TProductsFilterQuery = {
        page: 1, // Current page
        size: 1, // Products per page
        where: {
          price: {
            lte: 10,
          },
        },
        include: {
          user: true,
        },
      };

      const expectedResponse = {
        data: [
          {
            ...products[0],
            user: users[0],
          },
        ],
        meta: {
          count: 1,
          page: 1,
          totalPages: 1,
        },
      };

      // Act: Call the getProducts method with a filter query
      const result = await productsService.getProducts(filterQuery);

      // Assert: Verify the response matches the expected data
      expect(result).toEqual(expectedResponse);
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail if invalid filter query is provided', async () => {
      // Arrange: Setup mock data and responses
      const filterQuery = {
        page: 1, // Current page
        size: 1, // Products per page
        include: {
          ABC: true,
        },
      };

      // Act: Call the getProducts method with a filter query
      try {
        await productsService.getProducts(filterQuery as TProductsFilterQuery);
        // If reaches here, it hasn't thrown exception, so test failed
        expect(true).toBe(false);
      } catch (error) {
        // Assert: Verify the response matches the expected data
        expect(error).toBeInstanceOf(Prisma.PrismaClientValidationError);
      }
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // getProduct
  // -----------------------------------------------------------------------------------------------
  describe('getProduct', () => {
    // ---------------------------------------------------------------------------------------------
    test('should return product', async () => {
      // Arrange: Setup mock data and responses
      const id = products[0].id;
      const expectedResponse = products[0];

      // Act: Call the getProducts method with a filter query
      const result = await productsService.getProduct(id);

      // Assert: Verify the response matches the expected data
      expect(result).toEqual(expectedResponse);
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail if product is not found', async () => {
      // Arrange: Setup mock data and responses
      const id = 99999;

      // Act: Call the getProducts method with a filter query
      try {
        await productsService.getProduct(id);
        // If reaches here, it hasn't thrown exception, so test failed
        expect(true).toBe(false);
      } catch (error) {
        // Assert: Verify the response matches the expected data
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });
  // -----------------------------------------------------------------------------------------------
  // createProduct
  // -----------------------------------------------------------------------------------------------
  describe('createProduct', () => {
    // ---------------------------------------------------------------------------------------------
    test('should create product', async () => {
      // Arrange: Setup mock data and responses
      const userId = users[0].id;
      const body = {
        name: 'Product 7',
        price: 70,
      };

      const expectedResponse = {
        ...body,
        userId,
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      // Act: Call the getProducts method with a filter query
      const result = await productsService.createProduct(userId, body);

      // Assert: Verify the response matches the expected data
      expect(result).toEqual(expectedResponse);

      // Delete created product
      await db.product.delete({
        where: {
          id: result.id,
        },
      });
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail if userId is not found', async () => {
      // Arrange: Setup mock data and responses
      const userId = 99999;
      const body = {
        name: 'Product 7',
        price: 70,
      };

      // Act: Call the getProducts method with a filter query
      try {
        await productsService.createProduct(userId, body);
        // If reaches here, it hasn't thrown exception, so test failed
        expect(true).toBe(false);
      } catch (error) {
        // Assert: Verify the response matches the expected data
        expect(error).toBeInstanceOf(Error);
      }
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // updateProduct
  // -----------------------------------------------------------------------------------------------
  describe('updateProduct', () => {
    // ---------------------------------------------------------------------------------------------
    test('should update product', async () => {
      // Arrange: Setup mock data and responses
      const id = products[0].id;
      const userId = products[0].userId;
      const body = {
        price: 11, // New price (original: 10)
      };

      const expectedResponse = {
        ...products[0],
        ...body,
        userId,
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      // Act: Call the getProducts method with a filter query
      const result = await productsService.updateProduct(id, userId, body);

      // Assert: Verify the response matches the expected data
      expect(result).toEqual(expectedResponse);
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail if product is not found', async () => {
      // Arrange: Setup mock data and responses
      const id = 99999;
      const userId = products[0].userId;
      const body = {
        price: 11, // New price (original: 10)
      };

      // Act: Call the getProducts method with a filter query
      try {
        await productsService.updateProduct(id, userId, body);
        // If reaches here, it hasn't thrown exception, so test failed
        expect(true).toBe(false);
      } catch (error) {
        // Assert: Verify the response matches the expected data
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
    // ---------------------------------------------------------------------------------------------
    test.skip('should fail if userId is not the owner of product', async () => {
      // Arrange: Setup mock data and responses
      const id = products[0].id;
      const userId = 99999;
      const body = {
        price: 11, // New price (original: 10)
      };

      // Act: Call the getProducts method with a filter query
      try {
        await productsService.updateProduct(id, userId, body);
        // If reaches here, it hasn't thrown exception, so test failed
        expect(true).toBe(false);
      } catch (error) {
        // Assert: Verify the response matches the expected data
        expect(error).toBeInstanceOf(ForbiddenException);
      }
    });
    // ---------------------------------------------------------------------------------------------
    test.skip('should update if user is super admin', async () => {
      // Arrange: Setup mock data and responses

      // Mock 'isSuperAdmin' to return true
      isSuperAdminMock.mockReturnValueOnce(true);
      // Arbitrary user id for client, because we mocked 'isSuperAdmin' to return true
      const clientId = 999999;

      const id = products[0].id;
      const ownerUserId = products[0].userId;
      const body = {
        price: 11, // New price (original: 10)
      };

      const expectedResponse = {
        ...products[0],
        ...body,
        userId: ownerUserId,
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      // Act: Call the getProducts method with a filter query
      const result = await productsService.updateProduct(id, clientId, body);

      // Assert: Verify the response matches the expected data
      expect(result).toEqual(expectedResponse);
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // deleteProduct
  // -----------------------------------------------------------------------------------------------
  describe('deleteProduct', () => {
    // ---------------------------------------------------------------------------------------------
    test('should delete product', async () => {
      // Arrange: Setup mock data and responses
      const id = products[0].id;
      const userId = products[0].userId;

      // Act: Call the getProducts method with a filter query
      await productsService.deleteProduct(id, userId);

      // Try to get the product from db and expect it to throw an error
      try {
        const result = await productsService.getProduct(id);
        // If reaches here, it hasn't thrown exception, so test failed
        expect(true).toBe(false);
      } catch (error) {
        // Assert: Verify the response matches the expected data
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
    // ---------------------------------------------------------------------------------------------
    test('should fail if product is not found', async () => {
      // Arrange: Setup mock data and responses
      const id = 99999;
      const userId = products[0].userId;

      // Act: Call the getProducts method with a filter query
      try {
        await productsService.deleteProduct(id, userId);
        // If reaches here, it hasn't thrown exception, so test failed
        expect(true).toBe(false);
      } catch (error) {
        // Assert: Verify the response matches the expected data
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
    // ---------------------------------------------------------------------------------------------
    test.skip('should fail if userId is not the owner of product', async () => {
      // Arrange: Setup mock data and responses
      const id = products[products.length - 1].id; // Last product (to make sure it's not deleted before)
      const userId = 99999;

      // Act: Call the getProducts method with a filter query
      try {
        await productsService.deleteProduct(id, userId);
        // If reaches here, it hasn't thrown exception, so test failed
        expect(true).toBe(false);
      } catch (error) {
        // Assert: Verify the response matches the expected data
        expect(error).toBeInstanceOf(ForbiddenException);
      }
    });
    // ---------------------------------------------------------------------------------------------
  });
  // -----------------------------------------------------------------------------------------------
  // -----------------------------------------------------------------------------------------------
});
