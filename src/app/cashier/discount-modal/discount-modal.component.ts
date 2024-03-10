import { Component, ElementRef, LOCALE_ID, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../settings/settings.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-discount-modal',
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
  templateUrl: './discount-modal.component.html',
  styleUrls: ['./discount-modal.component.scss']
})
export class DiscountModalComponent implements OnInit {
  settingsService = inject(SettingsService);
  locale = inject<string>(LOCALE_ID);
  dialogRef = inject(MatDialogRef<DiscountModalComponent>);
  data = inject<{
    discountType: 'fixed' | 'percentage';
    value: number
  }>(MAT_DIALOG_DATA);

  discountType: 'fixed' | 'percentage' = this.data.discountType;
  discountFixed = '';
  discountPercentage = '';
  inputFixed = viewChild.required<ElementRef>('inputFixed');
  inputPercent = viewChild.required<ElementRef>('inputPercent');

  ngOnInit() {
    if (this.data.value) {
      if (this.discountType === 'fixed') {
        this.discountFixed = this.data.value.toString();
      } else if (this.discountType === 'percentage') {
        this.discountPercentage = this.data.value.toString();
      }
    }
  }

  submit() {
    this.dialogRef.close({
      discountType: this.discountType,
      value: this.discountType === 'fixed'
        ? parseFloat(this.discountFixed) || 0
        : parseFloat(this.discountPercentage) || 0
    });
  }

  onDiscountTypeChange() {
    this.discountFixed = '';
    this.discountPercentage = '';

    setTimeout(() => {
      if (this.discountType === 'fixed') {
        this.inputFixed().nativeElement.focus();
      } else if (this.discountType === 'percentage') {
        this.inputPercent().nativeElement.focus();
      }
    });
  }
}
