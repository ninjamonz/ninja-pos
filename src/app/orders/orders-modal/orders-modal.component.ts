import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IOrder, IOrderProduct, OrdersService } from '../orders.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CustomCurrencyPipe } from '../../_scam/custom-currency.pipe';
import { PrintersSelectorModalComponent } from '../../printers/printers-selector-modal/printers-selector-modal.component';
import { PrintService } from '../../_core/print.service';
import { SettingsService } from '../../settings/settings.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { CurrencyService } from '../../_core/currency.service';
import { DialogsService } from '../../dialogs/dialogs.service';

@Component({
  selector: 'app-orders-modal',
  standalone: true,
  imports: [
    CommonModule,
    CustomCurrencyPipe,

    // material module
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
  ],
  templateUrl: './orders-modal.component.html',
  styleUrl: './orders-modal.component.scss'
})
export class OrdersModalComponent implements OnInit {
  ordersService = inject(OrdersService);
  settingsService = inject(SettingsService);
  printService = inject(PrintService);
  cs = inject(CurrencyService);
  dialog = inject(MatDialog);
  dialogsService = inject(DialogsService);
  dialogRef = inject(MatDialogRef<OrdersModalComponent>);
  order = inject<IOrder>(MAT_DIALOG_DATA);

  isSaving = false;
  errorMessage = '';

  selectedProduct = signal<IOrderProduct[]>([]);
  total = computed(() => {
    const total = this.order.subtotal - this.order.discountAsValue + this.order.feeServiceAsValue + this.order.feeTaxAsValue;
    return this.cs.currency(total);
  });
  change = computed(() => {
    const total = this.order.paid - this.total();
    return this.cs.currency(total);
  });
  profit = computed(() => {
    const total = this.order.subtotal - this.order.discountAsValue + this.order.feeServiceAsValue - this.order.productionCost;
    return this.cs.currency(total);
  });

  async ngOnInit() {
    const products = await this.ordersService.findProducts(this.order.id);
    this.selectedProduct.set(products);
  }

  void() {
    this.dialogsService.confirm({
      message: `Void ${this.order.invoiceNumber}.`
    }).subscribe(async () => {
      this.errorMessage = '';
      this.toggleSaving();

      try {
        await this.ordersService.void(this.order.id);
        this.dialogRef.close({ mode: 'void' });
      } catch (error: any) {
        this.toggleSaving();
        this.errorMessage = `Failed to void "${this.order.invoiceNumber}".`;
        throw error;
      }
    });
  }

  toggleSaving() {
    this.isSaving = !this.isSaving;
  }

  close() {
    if (this.isSaving) {
      alert(`Saving changes. Please wait.`);
    } else {
      this.dialogRef.close();
    }
  }

  async print() {
    try {
      await this.printService.prepare();
    } catch (error: any) {
      return alert(error.message);
    }

    this.dialog.open(PrintersSelectorModalComponent, {
      data: null,
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      minWidth: '250px',
      maxWidth: '300px',
    }).afterClosed().subscribe(async (deviceId?: string) => {
      if (deviceId === undefined) return;

      this.printService.printInvoice({
        deviceId: deviceId,

        storeName: this.settingsService.receiptSetting.storeName,
        storeAddress: this.settingsService.receiptSetting.storeAddress,
        storeContact: this.settingsService.receiptSetting.storeContact,
        footerMessage: this.settingsService.receiptSetting.footerMessage,

        order: this.order,
        products: this.selectedProduct().map((p) => ({
          id: p.product_id,
          name: p.name,
          salesPrice: p.salesPrice,
          quantity: p.quantity,
        })),
        total: this.total(),
        change: this.change(),
      });
    });
  }
}
