import { NotFoundException } from "../../exceptions/not-found.exception";
import type { TCreateBody } from "./schemas/create-body.schema";
import type { TUpdateBody } from "./schemas/update-body.schema";

export type TProduct = {
  id: number;
  name: string;
  price: number;
};

const productsDB: TProduct[] = [
  {
    id: Date.now(),
    name: "Product 1",
    price: 100,
  },
  {
    id: Date.now(),
    name: "Product 2",
    price: 200,
  },
  {
    id: Date.now(),
    name: "Product 3",
    price: 300,
  },
];

export class ProductsService {
  // -----------------------------------------------------------------------------------------------
  // Get all
  async getProducts(): Promise<TProduct[]> {
    return productsDB;
  }

  // -----------------------------------------------------------------------------------------------
  // Get one
  async getProduct(id: number): Promise<TProduct> {
    const product = productsDB.find((product) => product.id === id);
    if (!product) {
      throw new NotFoundException();
    }

    return product;
  }

  // -----------------------------------------------------------------------------------------------
  // Create
  async createProduct(body: TCreateBody): Promise<TProduct> {
    const { name, price } = body;
    const newProduct = { id: Date.now(), name, price };

    productsDB.push(newProduct);

    return newProduct;
  }

  // -----------------------------------------------------------------------------------------------
  // Update
  async updateProduct(id: number, body: TUpdateBody): Promise<TProduct> {
    const { name, price } = body;

    const product = productsDB.find((product) => product.id === id);
    if (!product) {
      throw new NotFoundException();
    }

    if (name) product.name = name;
    if (price) product.price = price;

    return product;
  }
  // -----------------------------------------------------------------------------------------------
  // Delete
  async deleteProduct(id: number): Promise<void> {
    const index = productsDB.findIndex((product) => product.id === id);
    if (index === -1) {
      throw new NotFoundException();
    }

    productsDB.splice(index, 1);
  }

  // -----------------------------------------------------------------------------------------------
}
