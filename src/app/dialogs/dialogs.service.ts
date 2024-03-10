import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { DialogsConfirmComponent } from './dialogs-confirm/dialogs-confirm.component';
import { DialogsAlertComponent } from './dialogs-alert/dialogs-alert.component';

@Injectable({
  providedIn: 'root'
})
export class DialogsService {
  #dialog = inject(MatDialog);

  constructor() { }

  confirm(
    data: {
      title?: string,
      message?: string,
      textButtonYes?: string,
      textButtonNo?: string,
    },
    config?: MatDialogConfig
  ) {
    return this.#dialog.open(DialogsConfirmComponent, {
      data: data,
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      minWidth: '250px',
      ...config
    }).afterClosed().pipe(filter(value => value));
  }

  alert(
    data: {
      title?: string,
      message?: string,
      textButtonClose?: string,
    },
    config?: MatDialogConfig
  ) {
    return this.#dialog.open(DialogsAlertComponent, {
      data: data,
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      minWidth: '250px',
      ...config
    }).afterClosed();
  }
}
