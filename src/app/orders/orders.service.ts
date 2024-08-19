import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../db/database.service';
import { formattedDate } from '../_helpers/date-format';
import { SettingsService } from '../settings/settings.service';
import { CurrencyService } from '../_core/currency.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  #databaseService = inject(DatabaseService);
  #settingsService = inject(SettingsService);
  cs = inject(CurrencyService);

  constructor() { }

  async report(dateStart: string, dateEnd: string): Promise<IReport[]> {
    const sql_revenue = `SUM(subtotal) - SUM(discountAsValue) + SUM(feeServiceAsValue)`;
    const sql_expense = `SUM(productionCost)`;
    const sql_profit = `${sql_revenue} - ${sql_expense}`;

    const statement = `
    SELECT
    date(createdAt) as date,
    COUNT(*) AS numberOfTransactions,
    ${sql_revenue} as revenue,
    ${sql_expense} as expense,
    ROUND(${sql_profit}, 2) as profit
    
    FROM
    orders

    WHERE
    date(createdAt) BETWEEN '${dateStart}' AND '${dateEnd}' AND
    voidedAt IS NULL
    
    GROUP BY
    date(createdAt)
    
    ORDER BY
    date(createdAt);
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values || [];
    });
  }

  async findById(id: number): Promise<IOrder> {
    const statement = `SELECT * FROM orders WHERE id = ${id};`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values?.[0];
    });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<IOrder> {
    const statement = `SELECT * FROM orders WHERE invoiceNumber COLLATE NOCASE = '${invoiceNumber}';`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values?.[0];
    });
  }

  async findAll(): Promise<IOrder[]> {
    const statement = `SELECT * FROM orders ORDER BY createdAt DESC;`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values || [];
    });
  }

  async offsetPaging(currentPage: number, perPage: number): Promise<{
    total: number,
    data: IOrder[]
  }> {
    const offset = (currentPage - 1) * perPage;
    const statement = `SELECT * FROM orders ORDER BY createdAt DESC LIMIT ${perPage} OFFSET ${offset};`;
    const count = `SELECT COUNT(*) AS count FROM orders;`;
    return await this.#databaseService.executeQuery(async (db) => {
      const data = (await db.query(statement)).values || [];
      const total = (await db.query(count)).values?.[0].count;
      return { data, total };
    });
  }

  async findProducts(orderId: number): Promise<IOrderProduct[]> {
    const statement = `SELECT * FROM orders_products WHERE order_id = ${orderId};`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values || [];
    });
  }

  async generateNextInvoiceNumber() {
    const statement = `SELECT MAX(invoiceNumber) as invoiceNumber FROM orders;`;
    return await this.#databaseService.executeQuery(async (db) => {
      const invoiceNumber: string = (await db.query(statement)).values?.[0].invoiceNumber;
      if (!invoiceNumber) {
        return 'INV-000001';
      }

      const num = invoiceNumber.split('-')[1];
      const nextNum = parseInt(num) + 1;
      const nextInvoiceNumber = 'INV-' + (nextNum).toString().padStart(6, '0');
      return nextInvoiceNumber;
    });
  }

  async create(
    order: IOrderCreate,
    products: Omit<IOrderProduct, 'order_id'>[]
  ) {
    let subtotal = this.cs.currency(products.reduce((acc, item) => acc + item.quantity * item.salesPrice, 0));
    let productionCost = this.cs.currency(products.reduce((acc, item) => acc + item.quantity * item.productionCost, 0));
    let feeTaxAsValue: number;
    const isFeeServiceTaxable = this.#settingsService.generalSetting.isFeeServiceTaxable;

    if (order.discountAsValue) {
      order.discountAsPercent = 0;
    }
    if (order.discountAsPercent) {
      order.discountAsValue = this.cs.currency(subtotal * (order.discountAsPercent / 100));
    }

    if (order.feeServiceAsValue) {
      order.feeServiceAsPercent = 0;
    }
    if (order.feeServiceAsPercent) {
      order.feeServiceAsValue = this.cs.currency((subtotal - order.discountAsValue) * (order.feeServiceAsPercent / 100));
    }

    if (isFeeServiceTaxable) {
      feeTaxAsValue = this.cs.currency(
        (subtotal - order.discountAsValue + order.feeServiceAsValue) * (order.feeTaxAsPercent / 100)
      );
    } else {
      feeTaxAsValue = this.cs.currency(
        (subtotal - order.discountAsValue) * (order.feeTaxAsPercent / 100)
      );
    }
    /////////
    const nextInvoiceNumber = await this.generateNextInvoiceNumber();
    await this.#databaseService.executeQuery(async (db) => {
      const sql_insert_orders = `
      INSERT INTO orders
        (invoiceNumber, discountAsPercent, discountAsValue, feeServiceAsPercent, feeServiceAsValue, isFeeServiceTaxable, feeTaxAsPercent, feeTaxAsValue, subtotal, productionCost, paid, createdAt)
      VALUES
        ('${nextInvoiceNumber}', ${order.discountAsPercent}, ${order.discountAsValue}, ${order.feeServiceAsPercent}, ${order.feeServiceAsValue}, ${isFeeServiceTaxable}, ${order.feeTaxAsPercent}, ${feeTaxAsValue}, ${subtotal}, ${productionCost}, ${order.paid}, '${formattedDate(new Date())}');
      `;
      const result = await db.run(sql_insert_orders);

      let orders_products = '';
      for (const [index, value] of products.entries()) {
        const sql_update_products_stock = `
        UPDATE products
        SET stock = stock - ${value.quantity}
        WHERE id = ${value.product_id};
        `;
        await db.run(sql_update_products_stock);

        if (index >= 1) {
          orders_products += `,`;
        }
        orders_products += `(${result.changes?.lastId}, ${value.product_id}, '${value.name}', ${value.salesPrice}, ${value.productionCost}, ${value.sku}, ${value.barcode}, ${value.quantity})`;
      }

      const sql_insert_orders_products = `
      INSERT INTO orders_products (order_id, product_id, name, salesPrice, productionCost, sku, barcode, quantity)
      VALUES ${orders_products};
      `;
      await db.run(sql_insert_orders_products);
    });
    return nextInvoiceNumber;
  }

  async void(orderId: number) {
    const isVoidReturnStock = this.#settingsService.generalSetting.isVoidReturnStock;
    if (isVoidReturnStock) {
      await this.returningStock(orderId);
    }
    return await this.#databaseService.executeQuery(async (db) => {
      const statement = `
      UPDATE orders
      SET
        voidedAt = '${formattedDate(new Date())}',
        isVoidReturnStock = ${isVoidReturnStock}
      WHERE id = ${orderId};
      `;
      return await db.run(statement);
    });
  }

  async returningStock(orderId: number) {
    const products = await this.findProducts(orderId);

    return await this.#databaseService.executeQuery(async (db) => {
      for (const value of products) {
        const sql_update_products_stock = `
        UPDATE products
        SET stock = stock + ${value.quantity}
        WHERE id = ${value.product_id};
        `;
        await db.run(sql_update_products_stock);
      }
    });
  }
}

export interface IOrder {
  id: number;
  invoiceNumber: string;
  discountAsPercent: number;
  discountAsValue: number;
  feeServiceAsPercent: number;
  feeServiceAsValue: number;
  isFeeServiceTaxable: number;
  feeTaxAsPercent: number;
  feeTaxAsValue: number;
  subtotal: number;
  productionCost: number;
  paid: number;
  createdAt: string;
  updatedAt: string | null;
  // void
  voidedAt: string | null;
  isVoidReturnStock: number | null;
}
export interface IOrderCreate {
  discountAsPercent: number;
  discountAsValue: number;
  feeServiceAsPercent: number;
  feeServiceAsValue: number;
  feeTaxAsPercent: number;
  paid: number;
}

export interface IOrderProduct {
  order_id: number;
  product_id: number;
  name: string;
  salesPrice: number;
  productionCost: number;
  sku: string | null;
  barcode: string | null;
  quantity: number;
}

export interface IReport {
  date: string, // 2000-12-31
  numberOfTransactions: number,
  revenue: number,
  expense: number,
  profit: number,
}
