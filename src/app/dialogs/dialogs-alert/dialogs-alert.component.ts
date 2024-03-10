import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialogs-alert',
  standalone: true,
  imports: [
    // material module
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './dialogs-alert.component.html',
  styleUrl: './dialogs-alert.component.scss'
})
export class DialogsAlertComponent {
  data = inject<{
    title: string;
    message: string;
    textButtonClose: string;
  }>(MAT_DIALOG_DATA);
}
