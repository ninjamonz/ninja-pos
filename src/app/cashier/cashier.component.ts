import { Component, DestroyRef, ElementRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../layout/layout.service';
import { FormsModule } from '@angular/forms';
import { CategoriesService, ICategory } from '../categories/categories.service';
import { IProduct, ISelectedProduct, ProductsService } from '../products/products.service';
import { CashierService, ICart } from './cashier.service';
import { SettingsService } from '../settings/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { DiscountModalComponent } from './discount-modal/discount-modal.component';
import { TaxModalComponent } from './tax-modal/tax-modal.component';
import { ServiceModalComponent } from './service-modal/service-modal.component';
import { CheckoutModalComponent } from './checkout-modal/checkout-modal.component';
import { Subject, debounceTime } from 'rxjs';
import { SaveToCartModalComponent } from './save-to-cart-modal/save-to-cart-modal.component';
import { prepareBarcodeScanner } from '../_helpers/barcode';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { CustomCurrencyPipe } from '../_scam/custom-currency.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { MediaMatcher } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { CurrencyService } from '../_core/currency.service';
import { trim } from '../_helpers/trim';
import { DialogsService } from '../dialogs/dialogs.service';

@Component({
  selector: 'app-cashier',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CustomCurrencyPipe,
    NgxMaskDirective, NgxMaskPipe,

    // material module
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatToolbarModule,
    MatSidenavModule,
  ],
  providers: [provideNgxMask()],
  templateUrl: './cashier.component.html',
  styleUrls: ['./cashier.component.scss']
})
export class CashierComponent implements OnInit {
  layoutService = inject(LayoutService);
  categoriesService = inject(CategoriesService);
  productsService = inject(ProductsService);
  cashierService = inject(CashierService);
  settingsService = inject(SettingsService);
  cs = inject(CurrencyService);
  dialog = inject(MatDialog);
  dialogsService = inject(DialogsService);
  el = inject(ElementRef);
  destroyRef = inject(DestroyRef);
  media = inject(MediaMatcher);
  mobileQuery = this.media.matchMedia('(max-width: 960px)');

  search = '';
  search$ = new Subject<string>();
  categories: ICategory[] = [];
  productsList: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  selectedProduct = signal<ISelectedProduct[]>([]);
  selectedCategoryId = 0;
  selectedCartIndex = -1;
  carts: ICart[] = [];
  discount = signal(0);
  discountFixed = signal(0);
  feeService = signal(0);
  feeServiceFixed = signal(0);
  feeTax = signal(0);

  // selectors
  subtotal = computed(() => {
    let sum = 0;
    for (let item of this.selectedProduct()) {
      sum = sum + (item.quantity * item.salesPrice);
    }
    return this.cs.currency(sum);
  });
  discountValue = computed(() => {
    if (this.discountFixed()) {
      return this.discountFixed();
    }
    const discountValue = this.subtotal() * (this.discount() / 100);
    return this.cs.currency(discountValue);
  });
  feeServiceValue = computed(() => {
    if (this.feeServiceFixed()) {
      return this.feeServiceFixed();
    }
    const feeServiceValue = (this.subtotal() - this.discountValue()) * (this.feeService() / 100);
    return this.cs.currency(feeServiceValue);
  });
  feeTaxValue = computed(() => {
    let feeTaxValue;
    if (this.settingsService.generalSetting.isFeeServiceTaxable) {
      feeTaxValue = (this.subtotal() - this.discountValue() + this.feeServiceValue()) * (this.feeTax() / 100);
    }
    feeTaxValue = (this.subtotal() - this.discountValue()) * (this.feeTax() / 100);
    return this.cs.currency(feeTaxValue);
  });
  total = computed(() => {
    const total = this.subtotal() - this.discountValue() + this.feeServiceValue() + this.feeTaxValue();
    return this.cs.currency(total);
  });

  setCostSetting(): void {
    this.discountFixed.set(0);
    this.discount.set(
      this.settingsService.generalSetting.isDiscountAlwaysUsed
        ? this.settingsService.generalSetting.discount
        : 0
    );

    this.feeServiceFixed.set(0);
    this.feeService.set(
      this.settingsService.generalSetting.isFeeServiceAlwaysUsed
        ? this.settingsService.generalSetting.feeService
        : 0
    );

    this.feeTax.set(
      this.settingsService.generalSetting.isFeeTaxAlwaysUsed
        ? this.settingsService.generalSetting.feeTax
        : 0
    );
  }

  constructor() {
    effect(() => {
      if (
        !this.selectedProduct().length &&
        this.mobileQuery.matches &&
        this.productsList.length
      ) {
        this.hideMobileViewOrder();
      }

      if (
        this.selectedProduct().length &&
        this.mobileQuery.matches &&
        this.productsList.length
      ) {
        this.shakeCheckoutBtn();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.setCostSetting();

    this.categories = (await this.categoriesService.findAll());
    this.productsList = (await this.productsService.findAll()).filter((product) => (!product.archivedAt));
    this.filteredProducts = [...this.productsList];
    this.carts = (await this.cashierService.fetchCarts());

    this.search$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(888),
      )
      .subscribe((text: string) => {
        if (this.selectedCategoryId) {
          this.selectedCategoryId = 0;
        }
        const regex = new RegExp(text, 'i'); // 'i' flag for case-insensitive matching
        this.filteredProducts = this.productsList.filter((product) => (
          regex.test(product.name) ||
          text.toLowerCase() === product.sku?.toLowerCase() ||
          text.toLowerCase() === product.barcode?.toLowerCase()
        ));
      });
  }

  addItem(product: IProduct): void {
    if (product.inactiveAt) return;

    this.selectedProduct.update(value => {
      const index = value.findIndex((item) => item.id === product.id);
      if (index !== -1) {
        const newValue = [...value];
        newValue[index].quantity++;
        return newValue;
      }
      return [...value, { ...product, quantity: 1 }];
    });
  }

  removeItem(index: number): void {
    this.selectedProduct.update(value => {
      return [...value.slice(0, index), ...value.slice(index + 1)];
    });
  }

  increaseQty(index: number): void {
    this.selectedProduct.update(value => {
      const newValue = [...value];
      newValue[index].quantity++;
      return newValue;
    });
  }

  decreaseQty(index: number): void {
    this.selectedProduct.update(value => {
      if (value[index].quantity > 1) {
        const newValue = [...value];
        newValue[index].quantity--;
        return newValue;
      }
      return [...value.slice(0, index), ...value.slice(index + 1)];
    });
  }

  typingQty(index: number, quantity: number): void {
    this.selectedProduct.update(value => {
      const newValue = [...value];
      newValue[index].quantity = quantity;
      return newValue;
    });
  }

  async resetForm() {
    this.setCostSetting();
    this.filteredProducts = [...this.productsList];
    this.selectedProduct.set([]);
    this.selectedCategoryId = 0;
    this.selectedCartIndex = -1;
    this.search = '';
  }

  async loadCart(cart: ICart, index: number): Promise<void> {
    let items = [];
    const savedSelectedProduct = await this.cashierService.findCartsProducts(cart.id);

    for (let item of savedSelectedProduct) {
      const index = this.productsList.findIndex((product) => (
        product.id === item.product_id &&
        product.inactiveAt === null &&
        product.archivedAt === null
      ));
      if (index !== -1) {
        items.push({
          ...this.productsList[index],
          quantity: item.quantity
        });
      }
    }

    this.selectedProduct.set(items);
    this.selectedCartIndex = index;
  }

  // ------------------ FILTER ------------------ //
  onSearch() {
    this.search$.next(trim(this.search));
  }

  onClearSearch() {
    this.search = '';
    this.filteredProducts = [...this.productsList];
  }

  filterProductByCategoryId(categoryId: number) {
    this.selectedCategoryId = categoryId;
    this.search = '';

    if (categoryId === 0) {
      this.filteredProducts = [...this.productsList];
    } else {
      this.filteredProducts = this.productsList
        .filter((product) => product.category_id === categoryId);
    }
  }

  async scan(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return alert(`Currently, scan is only available for Android.`);
    }
    await prepareBarcodeScanner();

    const { barcodes } = await BarcodeScanner.scan();
    const text = barcodes?.[0]?.rawValue;
    if (!text) return;

    const product = this.productsList.find((product) => product.barcode?.toLowerCase() === text.toLowerCase());
    if (product) {
      if (product.inactiveAt) {
        alert(`Product inactive.`);
      } else if (product.archivedAt) {
        alert(`Product archived.`);
      } else {
        this.addItem(product);
        if (this.mobileQuery.matches) {
          this.showMobileViewOrder();
        }
      }
    } else {
      alert(`Product not found.`);
    }
    setTimeout(() => this.scan(), 1000);
  }

  // ------------------ DIALOG ------------------ //
  openDiscountModal(): void {
    this.dialog.open(DiscountModalComponent, {
      data: {
        discountType: this.discountFixed() ? 'fixed' : 'percentage',
        value: this.discountFixed() || this.discount()
      },
      autoFocus: true,
      restoreFocus: false,
      disableClose: false
    }).afterClosed().subscribe((result?: {
      discountType: 'fixed' | 'percentage',
      value: number,
    }) => {
      if (result === undefined) return;

      if (result.discountType === 'fixed') {
        this.discount.set(0);
        this.discountFixed.set(result.value);
      } else if (result.discountType === 'percentage') {
        this.discountFixed.set(0);
        this.discount.set(result.value);
      }
    });
  }

  openServiceModal(): void {
    this.dialog.open(ServiceModalComponent, {
      data: {
        feeServiceType: this.feeServiceFixed() ? 'fixed' : 'percentage',
        value: this.feeServiceFixed() || this.feeService()
      },
      autoFocus: true,
      restoreFocus: false,
      disableClose: false
    }).afterClosed().subscribe((result?: {
      feeServiceType: 'fixed' | 'percentage',
      value: number,
    }) => {
      if (result === undefined) return;

      if (result.feeServiceType === 'fixed') {
        this.feeService.set(0);
        this.feeServiceFixed.set(result.value);
      } else if (result.feeServiceType === 'percentage') {
        this.feeServiceFixed.set(0);
        this.feeService.set(result.value);
      }
    });
  }

  openTaxModal(): void {
    this.dialog.open(TaxModalComponent, {
      data: { feeTax: this.feeTax() },
      autoFocus: true,
      restoreFocus: false,
      disableClose: false
    }).afterClosed().subscribe((value?: number) => {
      if (
        value !== undefined && // backdrop
        value !== this.feeTax()
      ) {
        this.feeTax.set(value);
      }
    });
  }

  openCheckoutModal(): void {
    this.dialog.open(CheckoutModalComponent, {
      data: {
        order: {
          discountAsPercent: this.discount(),
          discountAsValue: this.discountFixed() ? this.discountValue() : 0,
          feeServiceAsPercent: this.feeService(),
          feeServiceAsValue: this.feeServiceFixed() ? this.feeServiceValue() : 0,
          feeTaxAsPercent: this.feeTax()
        },
        products: this.selectedProduct(),
        total: this.total()
      },
      autoFocus: true,
      restoreFocus: false,
      disableClose: false,
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }).afterClosed().subscribe(async (result?: boolean) => {
      if (!result) return;

      this.selectedProduct().forEach((item) => {
        if (item.stock === null) return;
        const index = this.productsList.findIndex((product) => product.id === item.id);
        this.productsList[index].stock! -= item.quantity;
      });

      if (this.selectedCartIndex !== -1) {
        await this.cashierService.removeCart(this.carts[this.selectedCartIndex].id);
        this.carts.splice(this.selectedCartIndex, 1);
      }

      this.resetForm();
      if (this.mobileQuery.matches) {
        this.hideMobileViewOrder();
      }
    });
  }

  resetFormConfirm(): void {
    this.dialogsService.confirm({
      message: `Reset form.`
    }).subscribe(() => {
      this.resetForm();
    });
  }

  saveCart(): void {
    this.dialog.open(SaveToCartModalComponent, {
      data: {
        cart: this.selectedCartIndex === -1 ? null : this.carts[this.selectedCartIndex],
        items: this.selectedProduct()
      },
      autoFocus: false,
      restoreFocus: false,
      disableClose: false
    }).afterClosed().subscribe((result?: ICart) => {
      if (result === undefined) return;

      if (this.selectedCartIndex === -1) {
        this.carts.push(result);
      } else {
        this.carts[this.selectedCartIndex] = result;
      }

      this.resetForm();
      if (this.mobileQuery.matches) {
        this.hideMobileViewOrder();
      }
    });
  }

  deleteCart(index: number): void {
    this.dialogsService.confirm({
      message: `Delete ${this.carts[index].title}.`
    }).subscribe(async () => {
      await this.cashierService.removeCart(this.carts[index].id);
      this.carts.splice(index, 1);

      if (index === this.selectedCartIndex) {
        this.resetForm();
      } else if (index < this.selectedCartIndex) {
        this.selectedCartIndex--;
      }
    });
  }

  // ------------------ MOBILE VIEW ------------------ //
  showMobileViewOrder(): void {
    this.el.nativeElement.querySelector('#column-cart-topbar').style.display = 'block';
    this.el.nativeElement.querySelector('#column-cart').style.display = 'block';
    this.el.nativeElement.querySelector('#row-checkout').style.display = 'none';
  }
  hideMobileViewOrder(): void {
    this.el.nativeElement.querySelector('#column-cart-topbar').style.display = 'none';
    this.el.nativeElement.querySelector('#column-cart').style.display = 'none';
    this.el.nativeElement.querySelector('#row-checkout').style.display = 'block';
  }
  shakeCheckoutBtn(): void {
    const el = this.el.nativeElement.querySelector('#btn-checkout');
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
  }
}
