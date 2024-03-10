import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../db/database.service';
import { formattedDate } from '../_helpers/date-format';
import { TIMESTAMPS } from '../_helpers/TYPES';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  #databaseService = inject(DatabaseService);

  constructor() { }

  async find(id: number): Promise<ICategory> {
    const statement = `SELECT * FROM categories WHERE id = ${id};`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values?.[0];
    });
  }

  async findAll(): Promise<ICategory[]> {
    const statement = `SELECT * FROM categories ORDER BY LOWER(name);`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values || [];
    });
  }

  async create(category: ICategoryCreate) {
    const statement = `
    INSERT INTO categories (name, createdAt)
    VALUES ('${category.name}', '${formattedDate(new Date())}');
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async update(category: ICategoryUpdate) {
    const statement = `
    UPDATE
      categories
    SET
      name = '${category.name}',
      updatedAt = '${formattedDate(new Date())}'
    WHERE
      id = ${category.id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async remove(id: number) {
    return await this.#databaseService.executeQuery(async (db) => {
      const sql_update_products_categoryId = `
      UPDATE products
      SET category_id = null
      WHERE category_id = ${id};
      `;
      await db.run(sql_update_products_categoryId);

      const sql_delete_categories = `
      DELETE FROM categories
      WHERE id = ${id};
      `;
      return await db.run(sql_delete_categories);
    });
  }
}

export interface ICategory {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string | null;
}
export interface ICategoryCreate extends Omit<ICategory, 'id' | TIMESTAMPS> { }
export interface ICategoryUpdate extends Omit<ICategory, TIMESTAMPS> { }
