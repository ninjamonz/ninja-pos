import { Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CashierService, ICart } from '../cashier.service';
import { ISelectedProduct } from '../../products/products.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trim } from '../../_helpers/trim';

@Component({
  selector: 'app-save-to-cart-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    // material module
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './save-to-cart-modal.component.html',
  styleUrls: ['./save-to-cart-modal.component.scss']
})
export class SaveToCartModalComponent implements OnInit {
  cashierService = inject(CashierService);
  dialogRef = inject(MatDialogRef<SaveToCartModalComponent>);
  data = inject<{
    cart: ICart | null,
    items: ISelectedProduct[]
  }>(MAT_DIALOG_DATA);

  myForm = viewChild.required<NgForm>('myForm');
  input = {
    title: '',
    notes: '',
  };
  isSaving = false;

  async ngOnInit() {
    if (this.data.cart) {
      this.input.title = this.data.cart.title;
      this.input.notes = this.data.cart.notes;
    }
  }

  async save() {
    this.toggleSaving();

    this.input.title = trim(this.input.title);
    this.input.notes = trim(this.input.notes);

    const items = this.data.items.map((item) => ({
      id: item.id,
      quantity: item.quantity
    }));

    try {
      if (this.data.cart) { // mode = edit
        await this.cashierService.updateCart({ ...this.input, id: this.data.cart.id }, items);
        const cart = await this.cashierService.fetchCart(this.data.cart.id);
        this.dialogRef.close(cart);
      } else { // mode = add
        const result = await this.cashierService.createCart(this.input, items);
        if (result.changes?.lastId) {
          const cart = await this.cashierService.fetchCart(result.changes.lastId);
          this.dialogRef.close(cart);
        }
      }
    } catch (error: any) {
      this.toggleSaving();

      if (error.message.toLowerCase().includes('carts.title')) {
        alert(`Duplicated title.`);
      } else {
        alert(`Failed to save.`);
      }

      throw error;
    }
  }

  toggleSaving() {
    this.isSaving = !this.isSaving;
    this.myForm().form.enabled
      ? this.myForm().form.disable()
      : this.myForm().form.enable();
    this.dialogRef.disableClose = !this.dialogRef.disableClose;
  }
}
