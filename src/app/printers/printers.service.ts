import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../db/database.service';

@Injectable({
  providedIn: 'root'
})
export class PrintersService {
  #databaseService = inject(DatabaseService);

  constructor() { }

  async findAll(): Promise<IPrinter[]> {
    const statement = `SELECT * FROM printers ORDER BY LOWER(name);`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values || [];
    });
  }

  async create(printer: IPrinterCreate) {
    const statement = `
    INSERT INTO printers
      (deviceId, name, paperSize)
    VALUES
      ('${printer.deviceId}', '${printer.name}', '${printer.paperSize}');
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async update(printer: IPrinter) {
    const statement = `
    UPDATE
      printers
    SET
      deviceId = '${printer.deviceId}',
      name = '${printer.name}',
      paperSize = '${printer.paperSize}'
    WHERE
      id = ${printer.id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }

  async remove(id: number) {
    const statement = `
    DELETE FROM printers
    WHERE id = ${id};
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      return await db.run(statement);
    });
  }
}

export interface IPrinter {
  id: number;
  deviceId: string;
  name: string;
  paperSize: string;
}
export interface IPrinterCreate extends Omit<IPrinter, 'id'> { }