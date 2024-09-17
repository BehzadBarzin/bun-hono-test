import { NotFoundException } from "../../exceptions/not-found.exception";
import type { TCreateBody } from "./schemas/create-body.schema";
import type { TUpdateBody } from "./schemas/update-body.schema";

import type { Product } from "@prisma/client";
import { db } from "../../utils/db";

export class ProductsService {
  // -----------------------------------------------------------------------------------------------
  // Get all
  async getProducts(): Promise<Product[]> {
    return await db.product.findMany();
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
  async createProduct(body: TCreateBody): Promise<Product> {
    const { name, price } = body;

    const newProduct = await db.product.create({
      data: {
        name,
        price,
      },
    });

    return newProduct;
  }

  // -----------------------------------------------------------------------------------------------
  // Update
  async updateProduct(id: number, body: TUpdateBody): Promise<Product> {
    const { name, price } = body;

    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException();
    }

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        name,
        price,
      },
    });

    return updatedProduct;
  }
  // -----------------------------------------------------------------------------------------------
  // Delete
  async deleteProduct(id: number): Promise<void> {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException();
    }

    await db.product.delete({ where: { id } });
  }

  // -----------------------------------------------------------------------------------------------
}
