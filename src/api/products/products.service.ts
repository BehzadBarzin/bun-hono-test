import { type Product } from '@prisma/client';

import { getPaginatedResponseMeta } from '../../common/schemas/pagination-query.schema';
import type { TPaginatedResponse } from '../../common/types/paginated-response.type';
import { NotFoundException } from '../../exceptions/not-found.exception';
import { db } from '../../utils/db';

import type { TCreateProductBody } from './schemas/create-product-body.schema';
import { getFindManyArgs, type TProductsFilterQuery } from './schemas/products-filter-query.schema';
import type { TUpdateProductBody } from './schemas/update-product-body.schema';

export class ProductsService {
  // -----------------------------------------------------------------------------------------------
  // Get all
  async getProducts(filterQuery: TProductsFilterQuery): Promise<TPaginatedResponse<Product>> {
    const findManyArgs = getFindManyArgs(filterQuery);
    const products = await db.product.findMany(findManyArgs);

    const count = await db.product.aggregate({
      where: filterQuery.where,
      _count: true,
    });

    return {
      data: products,
      meta: getPaginatedResponseMeta(count._count, filterQuery.page, filterQuery.size),
    };
  }

  // -----------------------------------------------------------------------------------------------
  // Get one
  async getProduct(id: number): Promise<Product> {
    const product = await db.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException();
    }

    return product;
  }

  // -----------------------------------------------------------------------------------------------
  // Create
  async createProduct(userId: number, body: TCreateProductBody): Promise<Product> {
    const newProduct = await db.product.create({
      data: {
        ...body,
        user: { connect: { id: userId } },
      },
    });

    return newProduct;
  }

  // -----------------------------------------------------------------------------------------------
  // Update
  async updateProduct(id: number, userId: number, body: TUpdateProductBody): Promise<Product> {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException();
    }

    const updatedProduct = await db.product.update({
      where: { id },
      data: body,
    });

    return updatedProduct;
  }
  // -----------------------------------------------------------------------------------------------
  // Delete
  async deleteProduct(id: number, userId: number): Promise<void> {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException();
    }

    await db.product.delete({ where: { id } });
  }

  // -----------------------------------------------------------------------------------------------
}
