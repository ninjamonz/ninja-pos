import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { IGeneralSetting, SettingsService } from '../settings/settings.service';

@Pipe({
  name: 'customCurrency',
  standalone: true
})
export class CustomCurrencyPipe implements PipeTransform {
  settingsService = inject(SettingsService);

  transform(
    value: any,
    currencyCode?: string,
    display?: 'code' | 'symbol' | 'symbol-narrow' | string,
    digitsInfo?: string,
    locale?: string
  ): string {
    return currencyPipe(
      this.settingsService.generalSetting,
      value,
      currencyCode,
      display,
      digitsInfo,
      locale
    );
  }
}

export function currencyPipe(
  generalSetting: IGeneralSetting,
  value: any,
  currencyCode?: string,
  display?: 'code' | 'symbol' | 'symbol-narrow' | string,
  digitsInfo?: string,
  locale?: string
) {
  return new CurrencyPipe('').transform(
    value,
    currencyCode || generalSetting?.currency || 'USD',
    display || 'symbol-narrow',
    digitsInfo || `1.${generalSetting?.currencyDecimalLength ?? '2'}-${generalSetting?.currencyDecimalLength ?? '2'}`,
    locale || generalSetting?.currencyThousandSeparator === '.' ? 'id' : 'en'
  ) || '';
}
