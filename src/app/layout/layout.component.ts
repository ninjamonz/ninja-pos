import { CommonModule } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { LayoutService } from './layout.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    // material module
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  layoutService = inject(LayoutService);

  leftSidenav = viewChild.required<MatSidenav>('leftSidenav');

  constructor() {
    this.layoutService.leftSidenav$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.leftSidenav().toggle());
  }
}
