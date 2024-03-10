import { Injectable, inject } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { BleClient } from '@capacitor-community/bluetooth-le';
// @ts-ignore
// import * as EscPosEncoder from 'esc-pos-encoder';
import EscPosEncoder from 'esc-pos-encoder';
import { IOrder } from '../orders/orders.service';
import { take } from 'rxjs';
import { currencyPipe } from '../_scam/custom-currency.pipe';
import { SettingsService } from '../settings/settings.service';
import { Capacitor } from '@capacitor/core';
import { CurrencyService } from './currency.service';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  bluetoothSerial = inject(BluetoothSerial);
  settingsService = inject(SettingsService);
  cs = inject(CurrencyService);

  constructor() { }

  currencyPipe(value: number) {
    return currencyPipe(this.settingsService.generalSetting, value);
  }

  printInvoice(
    data: {
      deviceId: string,

      storeName: string,
      storeAddress: string,
      storeContact: string,
      footerMessage: string,

      order: IOrder,
      products: {
        id: number,
        name: string,
        salesPrice: number,
        quantity: number,
      }[],
      total: number,
      change: number,
    }
  ) {
    // 58mm = 32 character
    // 80mm = 40 character
    const encoder = new EscPosEncoder();
    const result = encoder.initialize();
    /////////
    result.codepage('cp437');
    result.newline().newline();

    // header
    result.align('center');
    result.line(data.storeName);
    result.line(data.storeAddress);
    result.line(data.storeContact);
    result.newline();

    // content
    result.align('left').line(data.order.invoiceNumber + ' ' + data.order.createdAt);
    result.align('center').line('-'.repeat(30));
    for (let item of data.products) {
      const subtotal = this.cs.currency(item.quantity * item.salesPrice);
      result.align('left').line(item.name);
      result.align('right').line(
        this.currencyPipe(item.quantity) + ' ' +
        this.currencyPipe(item.salesPrice).padStart(11) + ' ' +
        this.currencyPipe(subtotal).padStart(13)
      );
    }
    result.align('center').line('-'.repeat(30));
    result.align('right');
    result.line(`Subtotal ${this.currencyPipe(data.order.subtotal).padStart(13)}`);
    if (data.order.discountAsPercent) {
      result.line(`Discount(${data.order.discountAsPercent}%) ${this.currencyPipe(data.order.discountAsValue).padStart(13)}`);
    } else if (data.order.discountAsValue) {
      result.line(`Discount ${this.currencyPipe(data.order.discountAsValue).padStart(13)}`);
    }
    if (data.order.feeServiceAsPercent) {
      result.line(`Service(${data.order.feeServiceAsPercent}%) ${this.currencyPipe(data.order.feeServiceAsValue).padStart(13)}`);
    } else if (data.order.feeServiceAsValue) {
      result.line(`Service ${this.currencyPipe(data.order.feeServiceAsValue).padStart(13)}`);
    }
    if (data.order.feeTaxAsPercent) {
      result.line(`Tax(${data.order.feeTaxAsPercent}%) ${this.currencyPipe(data.order.feeTaxAsValue).padStart(13)}`);
    }
    result.align('center').line('-'.repeat(30));
    result.align('right');
    result.line(`Total ${this.currencyPipe(data.total).padStart(13)}`);
    result.line(`Paid ${this.currencyPipe(data.order.paid).padStart(13)}`);
    if (data.change) {
      result.line(`Change ${this.currencyPipe(data.change).padStart(13)}`);
    }
    result.align('center').line('-'.repeat(30));

    // footer
    result.align('center');
    result.line(data.footerMessage);

    result.newline().newline().cut();
    /////////
    const resultByte = result.encode();
    this.bluetoothPrint(data.deviceId, resultByte);
  }

  bluetoothPrint(deviceId: string, resultByte: any) {
    this.bluetoothSerial.connect(deviceId).pipe(take(1)).subscribe({
      next: async value => {
        try {
          await this.bluetoothSerial.write(resultByte);
          this.bluetoothSerial.clear();
          this.bluetoothSerial.disconnect();
        } catch (error) {
          alert('Print failed.');
        }
      },
      error: err => {
        alert('Print failed.');
      },
    });
  }

  async prepare() {
    if (Capacitor.getPlatform() !== 'android') {
      throw new Error(`Currently, print is only available for Android.`);
    }

    // trick permission https://github.com/don/BluetoothSerial/issues/454
    await BleClient.initialize({ androidNeverForLocation: true });
    const isEnabled = await BleClient.isEnabled();
    if (!isEnabled) {
      throw new Error('Please turn on the bluetooth.');
    }
  }
}

/**
 * cheatsheet
 * await BleClient.isEnabled(); // check bluetooth on/off
 * await BleClient.requestDevice(); // get available devices
 * await this.bluetoothSerial.list(); // get paired devices
 */
