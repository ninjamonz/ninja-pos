import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../db/database.service';
import { formattedDate } from '../_helpers/date-format';
import { TIMESTAMPS } from '../_helpers/TYPES';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  #databaseService = inject(DatabaseService);

  constructor() { }

  async find(id: number): Promise<IProduct> {
    const statement = `SELECT * FROM products WHERE id = ${id};`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values?.[0];
    });
  }

  async findAll(): Promise<IProduct[]> {
    const statement = `SELECT * FROM products ORDER BY LOWER(name);`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values || [];
    });
  }

  async create(product: IProductCreate) {
    const statement = `
    INSERT INTO products
      (name, salesPrice, productionCost, stock, lowStockAlert, sku, barcode, category_id, createdAt)
    VALUES
      ('${product.name}', ${product.salesPrice}, ${product.productionCost}, ${product.stock}, ${product.lowStockAlert}, ${product.sku}, ${product.barcode}, ${product.category_id}, '${formattedDate(new Date())}');
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async update(product: IProductUpdate) {
    const statement = `
    UPDATE
      products
    SET
      name = '${product.name}',
      salesPrice = ${product.salesPrice},
      productionCost = ${product.productionCost},
      stock = ${product.stock},
      lowStockAlert = ${product.lowStockAlert},
      sku = ${product.sku},
      barcode = ${product.barcode},
      category_id = ${product.category_id},
      updatedAt = '${formattedDate(new Date())}'
    WHERE
      id = ${product.id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async markAsInactive(id: number) {
    const statement = `
    UPDATE products
    SET inactiveAt = '${formattedDate(new Date())}'
    WHERE id = ${id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async markAsActive(id: number) {
    const statement = `
    UPDATE products
    SET inactiveAt = null
    WHERE id = ${id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async archive(id: number) {
    const statement = `
    UPDATE products
    SET archivedAt = '${formattedDate(new Date())}'
    WHERE id = ${id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async restore(id: number) {
    const statement = `
    UPDATE products
    SET archivedAt = null
    WHERE id = ${id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }
}

export interface IProduct {
  id: number;
  name: string;
  salesPrice: number;

  productionCost: number;
  stock: number | null;
  lowStockAlert: number | null;
  sku: string | null;
  barcode: string | null;
  category_id: number | null;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
  inactiveAt: string | null;
}
export interface IProductCreate extends Omit<IProduct, 'id' | TIMESTAMPS | 'inactiveAt'> { }
export interface IProductUpdate extends Omit<IProduct, TIMESTAMPS | 'inactiveAt'> { }
export interface ISelectedProduct extends IProduct { quantity: number; }