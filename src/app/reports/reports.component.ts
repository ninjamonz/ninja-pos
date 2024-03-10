import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../layout/layout.service';
import { IReport, OrdersService } from '../orders/orders.service';
import { CustomCurrencyPipe } from '../_scam/custom-currency.pipe';
import { formattedDate } from '../_helpers/date-format';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { ReportsModalComponent } from './reports-modal/reports-modal.component';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-reports',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  layoutService = inject(LayoutService);
  ordersService = inject(OrdersService);
  dialog = inject(MatDialog);

  input = {
    dateStart: '',
    dateEnd: ''
  };
  reports = signal<IReport[]>([]);
  summary = computed(() => {
    const summary = {
      numberOfTransactions: 0,
      revenue: 0,
      expense: 0,
      profit: 0,
    };
    for (let report of this.reports()) {
      summary.numberOfTransactions += report.numberOfTransactions;
      summary.revenue += report.revenue;
      summary.expense += report.expense;
      summary.profit += report.profit;
    }
    return summary;
  });
  isFetching = false;
  errorMessage = '';

  ngOnInit() {
    //
  }

  async fetchData() {
    this.input.dateStart = formattedDate(new Date(this.input.dateStart)).slice(0, 10);
    this.input.dateEnd = formattedDate(new Date(this.input.dateEnd)).slice(0, 10);

    this.errorMessage = '';
    this.isFetching = true;

    try {
      const reports = await this.ordersService.report(this.input.dateStart, this.input.dateEnd);
      this.reports.set(reports);
    } catch (error) {
      this.errorMessage = `Failed to fetch data.`;
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  showTable() {
    this.dialog.open(ReportsModalComponent, {
      data: {
        dateStart: this.input.dateStart,
        dateEnd: this.input.dateEnd,
        reports: this.reports(),
      },
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh'
    });
  }
}
