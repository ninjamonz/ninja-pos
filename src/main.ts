/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

jeepSqlite(window);
window.addEventListener('DOMContentLoaded', async () => {
  const platform = Capacitor.getPlatform();
  const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite)
  try {
    if (platform === 'web') {
      console.log('in index.ts')
      const jeepEl = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepEl);
      jeepEl.autoSave = true;
      await customElements.whenDefined('jeep-sqlite');
      console.log('in index.ts after customElements')
      await sqlite.initWebStore();
      console.log('after sqlite.initWebStore()');
    }
    await sqlite.checkConnectionsConsistency();

    bootstrapApplication(AppComponent, appConfig)
      .catch((err) => console.error(err));
  } catch (err) {
    console.log(`Error: ${err}`);
    throw new Error(`Error: ${err}`)
  }

});

/**
 * ref
 * https://github.com/capacitor-community/sqlite/blob/web/docs/Web_Usage.md
 * https://github.com/jepiqueau/angular-sqlite-app-starter/blob/master/src/main.ts
 */
