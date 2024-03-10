import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IOrderCreate, OrdersService } from '../../orders/orders.service';
import { SettingsService } from '../../settings/settings.service';
import { provideNgxMask, NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { ISelectedProduct } from '../../products/products.service';
import { IPrinter } from '../../printers/printers.service';
import { PrintService } from '../../_core/print.service';
import { PrintersSelectorModalComponent } from '../../printers/printers-selector-modal/printers-selector-modal.component';
import { stringOrNull } from '../../_helpers/stringOrNull';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyService } from '../../_core/currency.service';

@Component({
  selector: 'app-checkout-modal',
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
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  providers: [provideNgxMask()],
  templateUrl: './checkout-modal.component.html',
  styleUrls: ['./checkout-modal.component.scss']
})
export class CheckoutModalComponent {
  ordersService = inject(OrdersService);
  settingsService = inject(SettingsService);
  printService = inject(PrintService);
  cs = inject(CurrencyService);
  dialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<CheckoutModalComponent>);
  data = inject<{
    order: Omit<IOrderCreate, 'paid'>,
    products: ISelectedProduct[],
    total: number
  }>(MAT_DIALOG_DATA);

  total = this.data.total;
  paid!: number;
  change = 0;
  invoiceNumber = '';
  isSaving = false;
  printers: IPrinter[] = [];

  async submit(): Promise<void> {
    this.isSaving = true;

    try {
      this.invoiceNumber = await this.ordersService.create(
        { ...this.data.order, paid: this.paid },
        this.data.products.map((p) => ({
          product_id: p.id,
          name: p.name,
          salesPrice: p.salesPrice,
          productionCost: p.productionCost,
          sku: stringOrNull(p.sku),
          barcode: stringOrNull(p.barcode),
          quantity: p.quantity,
        }))
      );
    } catch (error) {
      alert(`Failed to order.`);
      throw error;
    } finally {
      this.isSaving = false;
    }
  }

  onInputChange(): void {
    if (this.paid === undefined) return;
    this.change = this.cs.currency(this.paid - this.total);
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

      const order = await this.ordersService.findByInvoiceNumber(this.invoiceNumber);
      if (order) {
        this.printService.printInvoice({
          deviceId: deviceId,

          storeName: this.settingsService.receiptSetting.storeName,
          storeAddress: this.settingsService.receiptSetting.storeAddress,
          storeContact: this.settingsService.receiptSetting.storeContact,
          footerMessage: this.settingsService.receiptSetting.footerMessage,

          order: order,
          products: this.data.products,
          total: this.total,
          change: this.change,
        });
      }
    });
  }
}
