import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPrinter, PrintersService } from './printers.service';
import { MatDialog } from '@angular/material/dialog';
import { PrintersModalComponent } from './printers-modal/printers-modal.component';
import { LayoutService } from '../layout/layout.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-printers',
  standalone: true,
  imports: [
    CommonModule,

    // material module
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './printers.component.html',
  styleUrl: './printers.component.scss'
})
export class PrintersComponent implements OnInit {
  layoutService = inject(LayoutService);
  printersService = inject(PrintersService);
  dialog = inject(MatDialog);

  printers: IPrinter[] = [];
  isFetching = false;
  errorMessage = '';

  ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    this.errorMessage = '';
    this.isFetching = true;

    try {
      this.printers = await this.printersService.findAll();
    } catch (error) {
      this.errorMessage = `Failed to fetch data.`;
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  showForm(index: number) {
    this.dialog.open(PrintersModalComponent, {
      data: index === -1 ? null : this.printers[index],
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
