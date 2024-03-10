import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPrinter, PrintersService } from '../printers.service';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PrintersModalComponent } from '../printers-modal/printers-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-printers-selector-modal',
  standalone: true,
  imports: [
    CommonModule,

    // material module
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './printers-selector-modal.component.html',
  styleUrl: './printers-selector-modal.component.scss'
})
export class PrintersSelectorModalComponent implements OnInit {
  printersService = inject(PrintersService);
  dialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<PrintersSelectorModalComponent>);

  printers: IPrinter[] = [];

  async ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    try {
      this.printers = await this.printersService.findAll();
    } catch (error) {
      alert(`Failed to fetch data.`);
      this.dialogRef.close();
    }
  }

  addPrinter() {
    this.dialog.open(PrintersModalComponent, {
      data: null,
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }).afterClosed().subscribe((result?: {
      mode: 'add' | 'edit' | 'delete'
    }) => {
      if (result === undefined) return;
      this.fetchData();
    });
  }
}
