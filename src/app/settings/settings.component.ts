import { Component, LOCALE_ID, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { LayoutService } from '../layout/layout.service';
import { SettingsService } from './settings.service';
import { currencies } from '../_helpers/currencyList';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { trim } from '../_helpers/trim';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxMaskDirective, NgxMaskPipe,

    // material module
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatToolbarModule,
    MatCardModule,
    MatOptionModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,

  ],
  providers: [provideNgxMask()],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  locale = inject<string>(LOCALE_ID);
  layoutService = inject(LayoutService);
  settingsService = inject(SettingsService);
  currencies: { [key: string]: string } = currencies;
  currenciesCodes = Object.keys(currencies);

  formGeneralSetting = viewChild.required<NgForm>('formGeneralSetting');
  vmGeneralSetting = {
    currency: this.settingsService.generalSetting.currency,
    currencyDecimalLength: this.settingsService.generalSetting.currencyDecimalLength,
    currencyThousandSeparator: this.settingsService.generalSetting.currencyThousandSeparator,
    isVoidReturnStock: this.settingsService.generalSetting.isVoidReturnStock,
    discount: this.settingsService.generalSetting.discount,
    isDiscountAlwaysUsed: this.settingsService.generalSetting.isDiscountAlwaysUsed,
    feeService: this.settingsService.generalSetting.feeService,
    isFeeServiceAlwaysUsed: this.settingsService.generalSetting.isFeeServiceAlwaysUsed,
    isFeeServiceTaxable: this.settingsService.generalSetting.isFeeServiceTaxable,
    feeTax: this.settingsService.generalSetting.feeTax,
    isFeeTaxAlwaysUsed: this.settingsService.generalSetting.isFeeTaxAlwaysUsed,
  };
  isSavingGeneralSetting = false;

  formReceiptSetting = viewChild.required<NgForm>('formReceiptSetting');
  vmReceiptSetting = {
    storeName: this.settingsService.receiptSetting.storeName,
    storeAddress: this.settingsService.receiptSetting.storeAddress,
    storeContact: this.settingsService.receiptSetting.storeContact,
    footerMessage: this.settingsService.receiptSetting.footerMessage,
  };
  isSavingReceiptSetting = false;

  async saveGeneralSetting() {
    this.toggleSavingGeneralSetting();

    try {
      await this.settingsService.updateGeneralSettings({
        currency: this.vmGeneralSetting.currency,
        currencyDecimalLength: this.vmGeneralSetting.currencyDecimalLength,
        currencyThousandSeparator: this.vmGeneralSetting.currencyThousandSeparator,
        isVoidReturnStock: this.vmGeneralSetting.isVoidReturnStock,
        discount: this.vmGeneralSetting.discount || 0,
        isDiscountAlwaysUsed: this.vmGeneralSetting.isDiscountAlwaysUsed ? 1 : 0,
        feeService: this.vmGeneralSetting.feeService || 0,
        isFeeServiceAlwaysUsed: this.vmGeneralSetting.isFeeServiceAlwaysUsed ? 1 : 0,
        isFeeServiceTaxable: this.vmGeneralSetting.isFeeServiceTaxable ? 1 : 0,
        feeTax: this.vmGeneralSetting.feeTax || 0,
        isFeeTaxAlwaysUsed: this.vmGeneralSetting.isFeeTaxAlwaysUsed ? 1 : 0,
      });
      alert('Saved.');
    } catch (error) {
      alert(`Failed to save.`);
      throw error;
    } finally {
      this.toggleSavingGeneralSetting();
    }
  }

  async saveReceiptSetting() {
    this.toggleSavingReceiptSetting();

    this.vmReceiptSetting.storeName = trim(this.vmReceiptSetting.storeName);
    this.vmReceiptSetting.storeAddress = trim(this.vmReceiptSetting.storeAddress);
    this.vmReceiptSetting.storeContact = trim(this.vmReceiptSetting.storeContact);
    this.vmReceiptSetting.footerMessage = trim(this.vmReceiptSetting.footerMessage);

    try {
      await this.settingsService.updateReceiptSettings(this.vmReceiptSetting);
      alert('Saved.');
    } catch (error) {
      alert(`Failed to save.`);
      throw error;
    } finally {
      this.toggleSavingReceiptSetting();
    }
  }

  toggleSavingGeneralSetting() {
    this.isSavingGeneralSetting = !this.isSavingGeneralSetting;
    this.formGeneralSetting().form.enabled
      ? this.formGeneralSetting().form.disable()
      : this.formGeneralSetting().form.enable();
  }

  toggleSavingReceiptSetting() {
    this.isSavingReceiptSetting = !this.isSavingReceiptSetting;
    this.formReceiptSetting().form.enabled
      ? this.formReceiptSetting().form.disable()
      : this.formReceiptSetting().form.enable();
  }
}
