import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../db/database.service';
import { formattedDate } from '../_helpers/date-format';
import { TIMESTAMPS } from '../_helpers/TYPES';

@Injectable({
  providedIn: 'root'
})
export class CashierService {
  #databaseService = inject(DatabaseService);

  constructor() { }

  async fetchCart(id: number): Promise<ICart> {
    const statement = `SELECT * FROM carts WHERE id = ${id};`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values?.[0];
    });
  }

  async fetchCarts(): Promise<ICart[]> {
    const statement = `SELECT * FROM carts ORDER BY createdAt DESC;`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values || [];
    });
  }

  async findCartsProducts(cart_id: number): Promise<{ product_id: number, quantity: number }[]> {
    const statement = `
    SELECT product_id, quantity
    FROM carts_products
    WHERE cart_id=${cart_id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values || [];
    });
  }

  async createCart(
    cart: ICartCreate,
    products: { id: number, quantity: number }[]
  ) {
    return await this.#databaseService.executeQuery(async (db) => {
      const sql_insert_carts = `
      INSERT INTO carts
        (title, notes, createdAt)
      VALUES
        ('${cart.title}', '${cart.notes}', '${formattedDate(new Date())}');
      `;
      const result = await db.run(sql_insert_carts);

      if (!result.changes?.lastId) return result;
      const sql_insert_carts_products = this.sql_insert_carts_products(products, result?.changes?.lastId);
      await db.run(sql_insert_carts_products);

      return result;
    });
  }

  async updateCart(
    cart: ICartUpdate,
    products: { id: number, quantity: number }[]
  ) {
    return await this.#databaseService.executeQuery(async (db) => {
      const sql_delete_carts_products = `
      DELETE FROM carts_products
      WHERE cart_id = ${cart.id};
      `;
      await db.run(sql_delete_carts_products);

      const sql_update_carts = `
      UPDATE
        carts
      SET
        title = '${cart.title}',
        notes = '${cart.notes}',
        updatedAt = '${formattedDate(new Date())}'
      WHERE
        id = ${cart.id};
      `;
      const result = await db.run(sql_update_carts);

      const sql_insert_carts_products = this.sql_insert_carts_products(products, cart.id);
      await db.run(sql_insert_carts_products);

      return result;
    });
  }

  async removeCart(id: number) {
    return await this.#databaseService.executeQuery(async (db) => {
      const sql_delete_carts_products = `
      DELETE FROM carts_products
      WHERE cart_id = ${id};
      `;
      await db.run(sql_delete_carts_products);

      const sql_delete_carts = `
      DELETE FROM carts
      WHERE id = ${id};
      `;
      return await db.run(sql_delete_carts);
    });
  }

  private sql_insert_carts_products(
    products: { id: number, quantity: number }[],
    cart_id: number
  ): string {
    let carts_products = '';
    for (const [index, value] of products.entries()) {
      if (index >= 1) {
        carts_products += `,`;
      }
      carts_products += `(${cart_id}, ${value.id}, ${value.quantity})`;
    }

    return `
      INSERT INTO carts_products (cart_id, product_id, quantity)
      VALUES ${carts_products};
      `;
  }
}

export interface ICart {
  id: number;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
};
export interface ICartCreate extends Omit<ICart, 'id' | TIMESTAMPS> { }
export interface ICartUpdate extends Omit<ICart, TIMESTAMPS> { }
