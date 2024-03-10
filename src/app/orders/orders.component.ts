import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { OrdersModalComponent } from './orders-modal/orders-modal.component';
import { LayoutService } from '../layout/layout.service';
import { IOrder, OrdersService } from './orders.service';
import { formattedDate } from '../_helpers/date-format';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trim } from '../_helpers/trim';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    // material module
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  layoutService = inject(LayoutService);
  ordersService = inject(OrdersService);
  dialog = inject(MatDialog);

  orders: IOrder[] = [];
  pagination = {
    totalData: 0,
    pageSize: 10,
  };
  input = {
    search: '',
  };
  isFetching = false;
  errorMessage = '';

  async ngOnInit() {
    await this.fetchData(1, this.pagination.pageSize);
  }

  async handlePageEvent(e: PageEvent) {
    await this.fetchData(e.pageIndex + 1, e.pageSize);
  }

  async fetchData(currentPage: number, perPage: number) {
    this.errorMessage = '';
    this.isFetching = true;

    try {
      const result = await this.ordersService.offsetPaging(currentPage, perPage);
      this.orders = result.data;
      this.pagination.totalData = result.total;
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
      return await this.fetchData(1, this.pagination.pageSize);
    }

    this.errorMessage = '';
    this.isFetching = true;

    try {
      const order = await this.ordersService.findByInvoiceNumber(this.input.search);
      if (order) {
        this.orders = [order];
        this.pagination.totalData = 1;
      } else {
        alert(`Invoice ID "${this.input.search}" not found.`);
      }
    } catch (error) {
      this.errorMessage = `Failed to fetch data.`;
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  showForm(index: number) {
    this.dialog.open(OrdersModalComponent, {
      data: this.orders[index],
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }).afterClosed().subscribe((result?: {
      mode: 'void'
    }) => {
      if (result === undefined) return;

      switch (result.mode) {
        case 'void':
          this.orders[index].voidedAt = formattedDate(new Date());
          break;
      }
    });
  }
}
