import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { LayoutService } from '../layout/layout.service';
import { IProduct, ProductsService } from './products.service';
import { CustomCurrencyPipe } from '../_scam/custom-currency.pipe';
import { CategoriesService, ICategory } from '../categories/categories.service';
import { ProductsModalComponent } from './products-modal/products-modal.component';
import { formattedDate } from '../_helpers/date-format';
import { sortByProperty } from '../_helpers/sort';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductsArchiveModalComponent } from './products-archive-modal/products-archive-modal.component';
import { MatMenuModule } from '@angular/material/menu';
import { trim } from '../_helpers/trim';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomCurrencyPipe,

    // material module
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  layoutService = inject(LayoutService);
  productsService = inject(ProductsService);
  categoriesService = inject(CategoriesService);
  dialog = inject(MatDialog);

  productsList: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  input = {
    search: '',
  };
  isFetching = false;
  errorMessage = '';

  categories = signal<ICategory[]>([]);
  categoriesKey = computed(() => {
    const categoriesKey: { [key: string]: ICategory } = {};
    this.categories().forEach(item => categoriesKey[item.id] = item);
    return categoriesKey;
  });

  ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    this.errorMessage = '';
    this.isFetching = true;

    try {
      this.productsList = await this.productsService.findAll();
      this.filteredProducts = this.productsList.filter((product) => (!product.archivedAt));
      this.categories.set(await this.categoriesService.findAll());
    } catch (error) {
      this.errorMessage = `Failed to fetch data.`;
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  async search() {
    this.input.search = trim(this.input.search);
    if (!this.input.search) {
      this.filteredProducts = this.productsList.filter((product) => (!product.archivedAt));
    }

    const regex = new RegExp(this.input.search, 'i'); // 'i' flag for case-insensitive matching
    this.filteredProducts = this.productsList.filter((product) => (
      !product.archivedAt &&
      regex.test(product.name) ||
      this.input.search.toLowerCase() === product.sku?.toLowerCase() ||
      this.input.search.toLowerCase() === product.barcode?.toLowerCase()
    ));
  }

  showForm(filteredProductsIndex: number) {
    this.dialog.open(ProductsModalComponent, {
      data: {
        product: filteredProductsIndex === -1 ? null : this.filteredProducts[filteredProductsIndex],
        categories: this.categories
      },
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }).afterClosed().subscribe((result?: {
      product: IProduct,
      mode: 'add' | 'edit'
    } | {
      mode: 'archive' | 'inactive' | 'active'
    }) => {
      if (result === undefined) return;

      let productsListIndex!: number;
      if (filteredProductsIndex !== -1) {
        productsListIndex = this.productsList.findIndex(p => p.id === this.filteredProducts[filteredProductsIndex].id);
      }

      switch (result.mode) {
        case 'add':
          this.productsList.push(result.product);
          sortByProperty(this.productsList, 'name');

          this.filteredProducts.push(result.product);
          sortByProperty(this.filteredProducts, 'name');
          break;
        case 'edit':
          this.productsList[productsListIndex] = result.product;
          sortByProperty(this.productsList, 'name');

          this.filteredProducts[filteredProductsIndex] = result.product;
          sortByProperty(this.filteredProducts, 'name');
          break;
        case 'archive':
          this.productsList[productsListIndex].archivedAt = formattedDate(new Date());

          this.filteredProducts.splice(filteredProductsIndex, 1);
          break;
        case 'inactive':
          this.productsList[productsListIndex].inactiveAt = formattedDate(new Date());
          this.filteredProducts[filteredProductsIndex].inactiveAt = formattedDate(new Date());
          break;
        case 'active':
          this.productsList[productsListIndex].inactiveAt = null;
          this.filteredProducts[filteredProductsIndex].inactiveAt = null;
          break;
      }
    });
  }

  async showArchive() {
    const archivedProducts = this.productsList.filter((product) => (product.archivedAt));
    if (!archivedProducts.length) {
      return alert(`You don't have archived products.`);
    }

    this.dialog.open(ProductsArchiveModalComponent, {
      data: {
        archivedProducts: archivedProducts,
        categories: this.categories(),
        categoriesKey: this.categoriesKey()
      },
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }).afterClosed().subscribe(async () => {
      await this.fetchData();
      this.search();
    });
  }
}
