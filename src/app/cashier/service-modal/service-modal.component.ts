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
  selector: 'app-service-modal',
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
  templateUrl: './service-modal.component.html',
  styleUrls: ['./service-modal.component.scss']
})
export class ServiceModalComponent implements OnInit {
  settingsService = inject(SettingsService);
  locale = inject<string>(LOCALE_ID);
  dialogRef = inject(MatDialogRef<ServiceModalComponent>);
  data = inject<{
    feeServiceType: 'fixed' | 'percentage';
    value: number
  }>(MAT_DIALOG_DATA);

  feeServiceType: 'fixed' | 'percentage' = this.data.feeServiceType;
  feeServiceFixed = '';
  feeServicePercentage = '';
  inputFixed = viewChild.required<ElementRef>('inputFixed');
  inputPercent = viewChild.required<ElementRef>('inputPercent');

  ngOnInit() {
    if (this.data.value) {
      if (this.feeServiceType === 'fixed') {
        this.feeServiceFixed = this.data.value.toString();
      } else if (this.feeServiceType === 'percentage') {
        this.feeServicePercentage = this.data.value.toString();
      }
    }
  }

  submit() {
    this.dialogRef.close({
      feeServiceType: this.feeServiceType,
      value: this.feeServiceType === 'fixed'
        ? parseFloat(this.feeServiceFixed) || 0
        : parseFloat(this.feeServicePercentage) || 0
    });
  }

  onFeeServiceTypeChange() {
    this.feeServiceFixed = '';
    this.feeServicePercentage = '';

    setTimeout(() => {
      if (this.feeServiceType === 'fixed') {
        this.inputFixed().nativeElement.focus();
      } else if (this.feeServiceType === 'percentage') {
        this.inputPercent().nativeElement.focus();
      }
    });
  }
}
