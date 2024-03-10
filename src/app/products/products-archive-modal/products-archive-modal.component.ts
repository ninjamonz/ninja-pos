import { Component, inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IProduct, ProductsService } from '../products.service';
import { ICategory } from '../../categories/categories.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CustomCurrencyPipe } from '../../_scam/custom-currency.pipe';
import { DialogsService } from '../../dialogs/dialogs.service';

@Component({
  selector: 'app-products-archive-modal',
  standalone: true,
  imports: [
    CommonModule,
    CustomCurrencyPipe,

    // // material module
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatDialogModule,
  ],
  templateUrl: './products-archive-modal.component.html',
  styleUrl: './products-archive-modal.component.scss'
})
export class ProductsArchiveModalComponent {
  productsService = inject(ProductsService);
  dialog = inject(MatDialog);
  dialogsService = inject(DialogsService);
  data = inject<{
    archivedProducts: IProduct[],
    categories: ICategory[],
    categoriesKey: { [key: string]: ICategory }
  }>(MAT_DIALOG_DATA);

  restore(index: number) {
    this.dialogsService.confirm({
      message: `Restore ${this.data.archivedProducts[index].name}.`
    }).subscribe(async () => {
      try {
        await this.productsService.restore(this.data.archivedProducts[index].id);
        this.data.archivedProducts.splice(index, 1);
      } catch (error: any) {
        alert(`Unable to restore "${this.data.archivedProducts[index].name}".`);
        throw error;
      }
    });
  }
}
