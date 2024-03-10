import { Component, LOCALE_ID, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-tax-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxMaskDirective, NgxMaskPipe,

    // material module
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatRadioModule,
    MatDialogModule,
  ],
  providers: [provideNgxMask()],
  templateUrl: './tax-modal.component.html',
  styleUrls: ['./tax-modal.component.scss']
})
export class TaxModalComponent {
  locale = inject<string>(LOCALE_ID);
  dialogRef = inject(MatDialogRef<TaxModalComponent>);
  data = inject<{ feeTax: number }>(MAT_DIALOG_DATA);

  feeTax: string = this.data.feeTax ? this.data.feeTax.toString() : '';

  submit() {
    this.dialogRef.close(parseFloat(this.feeTax) || 0);
  }
}
