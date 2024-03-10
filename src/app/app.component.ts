import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { disableAndroidBackButton } from './_helpers/capacitor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor() {
    disableAndroidBackButton();
  }
}
