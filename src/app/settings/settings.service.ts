import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../db/database.service';
import { formattedDate } from '../_helpers/date-format';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  #databaseService = inject(DatabaseService);

  #generalSetting!: IGeneralSetting;
  #receiptSetting!: IReceiptSetting;

  public get generalSetting(): IGeneralSetting {
    return this.#generalSetting;
  }

  public get receiptSetting(): IReceiptSetting {
    return this.#receiptSetting;
  }

  constructor() { }

  async init() {
    [this.#generalSetting, this.#receiptSetting] = await Promise.all([
      this.getGeneralSettings(),
      this.getReceiptSettings()
    ]);
  }

  async getGeneralSettings(): Promise<IGeneralSetting> {
    const statement = `SELECT * FROM generalSettings;`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values?.[0];
    });
  }

  async getReceiptSettings(): Promise<IReceiptSetting> {
    const statement = `SELECT * FROM receiptSettings;`;
    return await this.#databaseService.executeQuery(async (db) => {
      return (await db.query(statement)).values?.[0];
    });
  }

  async updateGeneralSettings(setting: Omit<IGeneralSetting, 'id' | 'updatedAt'>) {
    const statement = `
    UPDATE
      generalSettings
    SET
      currency = '${setting.currency}',
      currencyDecimalLength = ${setting.currencyDecimalLength},
      currencyThousandSeparator = '${setting.currencyThousandSeparator}',
      isVoidReturnStock = ${setting.isVoidReturnStock},
      discount = ${setting.discount},
      isDiscountAlwaysUsed = ${setting.isDiscountAlwaysUsed},
      feeService = ${setting.feeService},
      isFeeServiceAlwaysUsed = ${setting.isFeeServiceAlwaysUsed},
      isFeeServiceTaxable = ${setting.isFeeServiceTaxable},
      feeTax = ${setting.feeTax},
      isFeeTaxAlwaysUsed = ${setting.isFeeTaxAlwaysUsed},
      updatedAt = '${formattedDate(new Date())}'
    WHERE
      id = 1;
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      const result = await db.run(statement);
      this.#generalSetting = await this.getGeneralSettings();
      return result;
    });
  }

  async updateReceiptSettings(setting: Omit<IReceiptSetting, 'id' | 'updatedAt'>) {
    const statement = `
    UPDATE
      receiptSettings
    SET
      storeName = '${setting.storeName}',
      storeAddress = '${setting.storeAddress}',
      storeContact = '${setting.storeContact}',
      footerMessage = '${setting.footerMessage}',
      updatedAt = '${formattedDate(new Date())}'
    WHERE
      id = 1;
    `;
    return await this.#databaseService.executeQuery(async (db) => {
      const result = await db.run(statement);
      this.#receiptSetting = await this.getReceiptSettings();
      return result;
    });
  }
}

export interface IGeneralSetting {
  id: number;
  currency: string;
  currencyDecimalLength: number;
  currencyThousandSeparator: ',' | '.' | ' ';
  isVoidReturnStock: number;
  discount: number;
  isDiscountAlwaysUsed: number;
  feeService: number;
  isFeeServiceAlwaysUsed: number;
  isFeeServiceTaxable: number;
  feeTax: number;
  isFeeTaxAlwaysUsed: number;
  updatedAt: string | null;
}

export interface IReceiptSetting {
  id: number;
  storeName: string;
  storeAddress: string;
  storeContact: string;
  footerMessage: string;
  updatedAt: string | null;
}