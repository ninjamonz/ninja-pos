import { Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesService, ICategory } from '../categories.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trim } from '../../_helpers/trim';
import { DialogsService } from '../../dialogs/dialogs.service';

@Component({
  selector: 'app-categories-modal',
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
    MatProgressSpinnerModule,
  ],
  templateUrl: './categories-modal.component.html',
  styleUrl: './categories-modal.component.scss'
})
export class CategoriesModalComponent implements OnInit {
  categoriesService = inject(CategoriesService);
  dialog = inject(MatDialog);
  dialogsService = inject(DialogsService);
  dialogRef = inject(MatDialogRef<CategoriesModalComponent>);
  category = inject<ICategory | null>(MAT_DIALOG_DATA);

  myForm = viewChild.required<NgForm>('myForm');
  input = {
    name: ''
  };
  isSaving = false;
  errorMessage = '';

  async ngOnInit() {
    if (this.category) { // mode = edit
      this.input.name = this.category.name;
    }
  }

  async submit() {
    this.errorMessage = '';
    this.toggleSaving();

    this.input.name = trim(this.input.name);

    try {
      if (this.category) { // mode = edit
        await this.categoriesService.update({ ...this.input, id: this.category.id });
        this.dialogRef.close({ mode: 'edit' });
      } else { // mode = add
        const lastid = (await this.categoriesService.create(this.input)).changes?.lastId;
        if (lastid) {
          const category = await this.categoriesService.find(lastid);
          this.dialogRef.close({ mode: 'add', category });
        }
      }
    } catch (error: any) {
      this.toggleSaving();

      if (error.message.toLowerCase().includes('categories.name')) {
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
        await this.categoriesService.remove(id);
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
