import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../layout/layout.service';
import { CategoriesService, ICategory } from './categories.service';
import { MatDialog } from '@angular/material/dialog';
import { CategoriesModalComponent } from './categories-modal/categories-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,

    // material module
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  layoutService = inject(LayoutService);
  categoriesService = inject(CategoriesService);
  dialog = inject(MatDialog);

  categories: ICategory[] = [];
  isFetching = false;
  errorMessage = '';

  ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    this.errorMessage = '';
    this.isFetching = true;

    try {
      this.categories = (await this.categoriesService.findAll());
    } catch (error) {
      this.errorMessage = `Failed to fetch data.`;
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  showForm(index: number) {
    this.dialog.open(CategoriesModalComponent, {
      data: index === -1 ? null : this.categories[index],
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
