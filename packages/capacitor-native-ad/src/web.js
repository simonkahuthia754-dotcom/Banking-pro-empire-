import { WebPlugin } from '@capacitor/core';

export class NativeAdPluginWeb extends WebPlugin {
  async showNativeAd() {
    console.warn('NativeAdPlugin: native ads are not available on web.');
    return { shown: false };
  }
  async hideNativeAd() {
    return;
  }
}
