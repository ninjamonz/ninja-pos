import { Injectable, inject } from '@angular/core';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { SQLiteService } from './sqlite.service';
import { environment } from '../../environments/environment';

interface SQLiteDBConnectionCallback<T> { (myArguments: SQLiteDBConnection): T }

@Injectable()
export class DatabaseService {
  #sqlite = inject(SQLiteService);

  constructor() { }

  /**
   * this function will handle the sqlite isopen and isclosed automatically for you.
   * @param callback: The callback function that will execute multiple SQLiteDBConnection commands or other stuff.
   * @param databaseName optional another database name
   * @returns any type you want to receive from the callback function.
   */
  async executeQuery<T>(callback: SQLiteDBConnectionCallback<T>, databaseName: string = environment.databaseName): Promise<T> {
    try {
      let isConnection = await this.#sqlite.isConnection(databaseName);

      if (isConnection.result) {
        let db = await this.#sqlite.retrieveConnection(databaseName);
        return await callback(db);
      }
      else {
        const db = await this.#sqlite.createConnection(databaseName, false, 'no-encryption', 1);
        await db.open();
        let cb = await callback(db);
        // https://github.com/capacitor-community/sqlite/issues/230#issuecomment-1055316091
        // await this.#sqlite.closeConnection(databaseName);
        return cb;
      }
    } catch (error) {
      throw Error(`DatabaseServiceError: ${error}`);
    }
  }
}

/**
 * ref
 * https://github.com/capacitor-community/sqlite/blob/master/docs/Ionic-Angular-Usage.md
 * https://github.com/jepiqueau/angular-sqlite-app-starter
 */