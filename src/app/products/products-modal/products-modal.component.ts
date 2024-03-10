import { Component, OnInit, WritableSignal, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import { IProduct, IProductCreate, ProductsService } from '../products.service';
import { provideNgxMask, NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { SettingsService } from '../../settings/settings.service';
import { ICategory } from '../../categories/categories.service';
import { stringOrNull } from '../../_helpers/stringOrNull';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CategoriesModalComponent } from '../../categories/categories-modal/categories-modal.component';
import { sortByProperty } from '../../_helpers/sort';
import { trim } from '../../_helpers/trim';
import { DialogsService } from '../../dialogs/dialogs.service';

@Component({
  selector: 'app-products-modal',
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
    MatMenuModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  providers: [provideNgxMask()],
  templateUrl: './products-modal.component.html',
  styleUrl: './products-modal.component.scss'
})
export class ProductsModalComponent implements OnInit {
  settingsService = inject(SettingsService);
  productsService = inject(ProductsService);
  dialog = inject(MatDialog);
  dialogsService = inject(DialogsService);
  dialogRef = inject(MatDialogRef<ProductsModalComponent>);
  data = inject<{
    product: IProduct | null,
    categories: WritableSignal<ICategory[]>
  }>(MAT_DIALOG_DATA);

  myForm = viewChild.required<NgForm>('myForm');
  vm: {
    name: string;
    salesPrice: number;
    productionCost: number;
    isStockTracked: boolean;
    stock: number | null;
    stockWarningLimit: number | null;
    sku: string | null;
    barcode: string | null;
    category_id: number | null;
  } = {
      name: '',
      salesPrice: 0,
      productionCost: 0,
      isStockTracked: false,
      stock: null,
      stockWarningLimit: null,
      sku: null,
      barcode: null,
      category_id: 0
    };
  isSaving = false;
  errorMessage = '';

  async ngOnInit() {
    if (this.data.product) { // mode = edit
      this.vm.name = this.data.product.name;
      this.vm.salesPrice = this.data.product.salesPrice;
      this.vm.productionCost = this.data.product.productionCost;
      this.vm.stock = this.data.product.stock;
      if (this.vm.stock !== null) {
        this.vm.isStockTracked = true;
      }
      this.vm.stockWarningLimit = this.data.product.stockWarningLimit;
      this.vm.sku = this.data.product.sku;
      this.vm.barcode = this.data.product.barcode;

      const hasCategory = this.data.categories().find(o => o.id === this.data.product?.category_id);
      if (hasCategory) {
        this.vm.category_id = this.data.product.category_id;
      }
    }
  }

  async submit() {
    this.errorMessage = '';
    this.toggleSaving();

    this.vm.name = trim(this.vm.name);
    this.vm.sku = this.vm.sku ? trim(this.vm.sku) : null;
    this.vm.barcode = this.vm.barcode ? trim(this.vm.barcode) : null;

    const params: IProductCreate = {
      name: this.vm.name,
      salesPrice: this.vm.salesPrice,
      productionCost: this.vm.productionCost,
      stock: !this.vm.isStockTracked ? null : this.vm.stock || 0,
      stockWarningLimit: !this.vm.isStockTracked ? null : this.vm.stockWarningLimit || 0,
      sku: stringOrNull(this.vm.sku),
      barcode: stringOrNull(this.vm.barcode),
      category_id: this.vm.category_id || null,
    };

    try {
      if (this.data.product) { // mode = edit
        await this.productsService.update({ ...params, id: this.data.product.id });
        const product = await this.productsService.find(this.data.product.id);
        this.dialogRef.close({ mode: 'edit', product });
      } else { // mode = add
        const result = await this.productsService.create(params);
        if (result.changes?.lastId) {
          const product = await this.productsService.find(result.changes.lastId);
          this.dialogRef.close({ mode: 'add', product });
        }
      }
    } catch (error: any) {
      this.toggleSaving();

      if (error.message.toLowerCase().includes('products.name')) {
        this.errorMessage = `Duplicated name.`;
      } else if (error.message.toLowerCase().includes('products.sku')) {
        this.errorMessage = `SKU "${params.sku}" already exists.`;
      } else if (error.message.toLowerCase().includes('products.barcode')) {
        this.errorMessage = `Barcode "${params.barcode}" already exists.`;
      } else {
        this.errorMessage = `Failed to save.`;
      }

      throw error;
    }
  }

  archive(id: number) {
    this.dialogsService.confirm({
      message: `Archive ${this.vm.name}.`
    }).subscribe(async () => {
      this.errorMessage = '';
      this.toggleSaving();

      try {
        await this.productsService.archive(id);
        this.dialogRef.close({ mode: 'archive' });
      } catch (error: any) {
        this.toggleSaving();
        this.errorMessage = `Failed to archive "${this.vm.name}".`;
        throw error;
      }
    });
  }

  disable(id: number) {
    this.dialogsService.confirm({
      message: `Disable ${this.vm.name}.`
    }).subscribe(async () => {
      this.errorMessage = '';
      this.toggleSaving();

      try {
        await this.productsService.disable(id);
        this.dialogRef.close({ mode: 'disable' });
      } catch (error: any) {
        this.toggleSaving();
        this.errorMessage = `Failed to disable "${this.vm.name}".`;
        throw error;
      }
    });
  }

  enable(id: number) {
    this.dialogsService.confirm({
      message: `Enable ${this.vm.name}.`
    }).subscribe(async () => {
      this.errorMessage = '';
      this.toggleSaving();

      try {
        await this.productsService.enable(id);
        this.dialogRef.close({ mode: 'enable' });
      } catch (error: any) {
        this.toggleSaving();
        this.errorMessage = `Failed to enable "${this.vm.name}".`;
        throw error;
      }
    });
  }

  toggleSaving() {
    this.isSaving = !this.isSaving;
    this.myForm().form.enabled
      ? this.myForm().form.disable()
      : this.myForm().form.enable();
  }

  close() {
    if (this.isSaving) {
      alert(`Saving changes. Please wait.`);
    } else {
      this.dialogRef.close();
    }
  }

  addCategory() {
    this.dialog.open(CategoriesModalComponent, {
      data: null,
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }).afterClosed().subscribe((result?: {
      mode: 'add',
      category: ICategory
    }) => {
      if (result === undefined) return;
      this.data.categories.update(value => {
        value.push(result.category);
        sortByProperty(value, 'name');
        return [...value];
      });
      this.vm.category_id = result.category.id;
    });
  }
}
