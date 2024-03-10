import { Injectable, inject } from '@angular/core';
import { SettingsService } from '../settings/settings.service';
import currency from 'currency.js';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  settingsService = inject(SettingsService);

  constructor() { }

  currency(input: currency.Any) {
    return currency(input, {
      precision: this.settingsService.generalSetting.currencyDecimalLength || 2
    }).value;
  }
}
