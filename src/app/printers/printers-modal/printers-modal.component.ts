import { Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IPrinter, PrintersService } from '../printers.service';
import { FormsModule, NgForm } from '@angular/forms';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { trim } from '../../_helpers/trim';
import { DialogsService } from '../../dialogs/dialogs.service';

@Component({
  selector: 'app-printers-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    // material module
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatToolbarModule,
    MatMenuModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './printers-modal.component.html',
  styleUrl: './printers-modal.component.scss'
})
export class PrintersModalComponent implements OnInit {
  printersService = inject(PrintersService);
  dialog = inject(MatDialog);
  dialogsService = inject(DialogsService);
  dialogRef = inject(MatDialogRef<PrintersModalComponent>);
  printer = inject<IPrinter | null>(MAT_DIALOG_DATA);

  myForm = viewChild.required<NgForm>('myForm');
  input = {
    name: '',
    deviceId: '',
    paperSize: ''
  };
  isSaving = false;
  errorMessage = '';

  async ngOnInit() {
    if (this.printer) { // mode = edit
      const { id, ...input } = this.printer;
      this.input = input;
    } else { // mode = add
      if (Capacitor.getPlatform() !== 'android') return;
      await BleClient.initialize({ androidNeverForLocation: true });
      const isEnabled = await BleClient.isEnabled();
      if (isEnabled) {
        const device = await BleClient.requestDevice();
        this.input.name = device.name || device.deviceId;
        this.input.deviceId = device.deviceId;
      }
    }
  }

  async submit() {
    this.errorMessage = '';
    this.toggleSaving();

    this.input.name = trim(this.input.name);
    this.input.deviceId = trim(this.input.deviceId);

    try {
      if (this.printer) { // mode = edit
        await this.printersService.update({ ...this.input, id: this.printer.id });
        this.dialogRef.close({ mode: 'edit' });
      } else { // mode = add
        await this.printersService.create(this.input);
        this.dialogRef.close({ mode: 'add' });
      }
    } catch (error: any) {
      this.toggleSaving();

      if (error.message.toLowerCase().includes('printers.deviceId')) {
        this.errorMessage = `Device ID "${this.input.deviceId}" already exists.`;
      } else if (error.message.toLowerCase().includes('printers.name')) {
        this.errorMessage = `Duplicated name.`;
      } else {
        this.errorMessage = `Failed to save.`;
      }

      throw error;
    }
  }

  remove(id: number) {
    this.dialogsService.confirm({
      message: `Delete ${this.input.name}.`
    }).subscribe(async () => {
      this.errorMessage = '';
      this.toggleSaving();

      try {
        await this.printersService.remove(id);
        this.dialogRef.close({ mode: 'delete' });
      } catch (error: any) {
        this.toggleSaving();
        this.errorMessage = `Delete failed.`;
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
}
