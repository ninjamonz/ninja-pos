import { Injectable, inject } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  #router = inject(Router);

  #previousUrl = '';

  constructor() { }

  get previousUrl(): string {
    return this.#previousUrl;
  }
  set previousUrl(value: string) {
    this.#previousUrl = value;
  }

  init(): void {
    this.#router.events
      .pipe(
        filter((event: any) => event instanceof RoutesRecognized),
        pairwise(),
      )
      .subscribe((events: RoutesRecognized[]) => {
        this.previousUrl = events[0].urlAfterRedirects;
      });
  }

  back(alternativePath: string): void {
    this.#router.navigateByUrl(this.previousUrl || alternativePath);
  }
}

/**
 * ref
 * https://stackoverflow.com/a/47880387/5674219
 */
