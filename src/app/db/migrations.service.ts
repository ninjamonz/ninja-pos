import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { dummies, migrations, seeds } from './migration';
import { environment } from '../../environments/environment';

@Injectable()
export class MigrationService {
  #databaseService = inject(DatabaseService);

  constructor() { }

  async migrate() {
    await this.#databaseService.executeQuery(async (db) => {
      const isTableExists = (await db.getTableList()).values?.length;
      if (!isTableExists) {
        await db.execute(migrations);
        await db.execute(seeds);
        if (!environment.production) {
          await db.execute(dummies);
        }
      }
    });
  }
}

/**
 * ref
 * https://github.com/capacitor-community/sqlite/blob/master/docs/Ionic-Angular-Usage.md
 * https://github.com/jepiqueau/angular-sqlite-app-starter
 */