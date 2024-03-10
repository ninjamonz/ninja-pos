import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialogs-confirm',
  standalone: true,
  imports: [
    // material module
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './dialogs-confirm.component.html',
  styleUrl: './dialogs-confirm.component.scss'
})
export class DialogsConfirmComponent {
  data = inject<{
    title: string;
    message: string;
    textButtonYes: string;
    textButtonNo: string;
  }>(MAT_DIALOG_DATA);
}
