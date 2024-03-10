import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

export async function prepareBarcodeScanner(): Promise<void> {
  if (!(await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()).available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    // https://github.com/capawesome-team/capacitor-mlkit/issues/38#issuecomment-1626891989
    await installGoogleBarcodeScannerModuleFinished();
  }

  // if ((await BarcodeScanner.checkPermissions()).camera !== 'granted') {
  //   await BarcodeScanner.requestPermissions();
  // }
  // await BarcodeScanner.isSupported();
}

function installGoogleBarcodeScannerModuleFinished() {
  return new Promise(async (resolve) => {
    const checkCondition = async () => {
      (await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()).available
        ? resolve(true)
        : setTimeout(checkCondition, 500);
    };
    checkCondition();
  });
}

/**
 * ref
 * https://github.com/capawesome-team/capacitor-mlkit/tree/main/packages/barcode-scanning
 */