import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  #backgroundColor = 'white';
  #leftSidenav = new Subject<void>();
  readonly leftSidenav$ = this.#leftSidenav.asObservable();

  constructor() { }

  public get backgroundColor() {
    return this.#backgroundColor;
  }
  public set backgroundColor(value) {
    this.#backgroundColor = value;
  }

  leftSidenavToggle(): void {
    this.#leftSidenav.next();
  }
}
