import { App } from '@capacitor/app';

export function disableAndroidBackButton() {
  App.addListener('backButton', (data) => {
    if (!data.canGoBack) {
      // The user pressed the back button, and there is no page to go back to.
      // You can add your custom handling code here, or leave it empty to disable the back button.
    } else {
      // The user pressed the back button, and there is a page to go back to.
      // Use data.goBack() to navigate back.
    }
  });
}