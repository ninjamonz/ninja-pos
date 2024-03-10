import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IReport } from '../../orders/orders.service';
import { CustomCurrencyPipe } from '../../_scam/custom-currency.pipe';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reports-modal',
  standalone: true,
  imports: [
    CommonModule,
    CustomCurrencyPipe,

    // material module
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatDialogModule,
  ],
  templateUrl: './reports-modal.component.html',
  styleUrl: './reports-modal.component.scss'
})
export class ReportsModalComponent {
  data = inject<{
    dateStart: string,
    dateEnd: string,
    reports: IReport[]
  }>(MAT_DIALOG_DATA);
}
