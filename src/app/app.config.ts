import { APP_INITIALIZER, ApplicationConfig, DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { registerLocaleData } from '@angular/common';
import localeId from '@angular/common/locales/id';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { DatabaseService } from './db/database.service';
import { InitializeAppService } from './db/initialize.app.service';
import { MigrationService } from './db/migrations.service';
import { SQLiteService } from './db/sqlite.service';
import { SettingsService } from './settings/settings.service';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

registerLocaleData(localeId);

function initializeFactory(init: InitializeAppService) {
  return () => init.initializeApp();
}

function localeIdFactory(settingsService: SettingsService) {
  return settingsService.generalSetting?.currencyThousandSeparator === '.' ? 'id' : 'en';
}

function currencyCodeFactory(settingsService: SettingsService) {
  return settingsService.generalSetting?.currency || 'USD';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),

    SQLiteService,
    DatabaseService,
    MigrationService,
    InitializeAppService,
    BluetoothSerial,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeFactory,
      deps: [InitializeAppService],
      multi: true
    },
    {
      provide: LOCALE_ID,
      useFactory: localeIdFactory,
      deps: [SettingsService]
    },
    {
      provide: DEFAULT_CURRENCY_CODE,
      useFactory: currencyCodeFactory,
      deps: [SettingsService]
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
        floatLabel: 'always'
      }
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-CA'
    },
  ]
};
