
import { SQLiteService } from './sqlite.service';
import { Injectable, inject } from '@angular/core';
import { MigrationService } from './migrations.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class InitializeAppService {
  #sqliteService = inject(SQLiteService);
  #migrationService = inject(MigrationService);
  #settingsService = inject(SettingsService);

  constructor() { }

  async initializeApp() {
    await this.#sqliteService.initializePlugin().then(async (ret) => {
      try {
        //execute startup queries
        await this.#migrationService.migrate();
        await this.#settingsService.init();
      } catch (error) {
        alert('initializeApp error.');
        throw Error(`initializeAppError: ${error}`);
      }
    });
  }
}

/**
 * ref
 * https://github.com/capacitor-community/sqlite/blob/master/docs/Ionic-Angular-Usage.md
 * https://github.com/jepiqueau/angular-sqlite-app-starter
 */