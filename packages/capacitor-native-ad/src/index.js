import { registerPlugin } from '@capacitor/core';

const NativeAdPlugin = registerPlugin('NativeAdPlugin', {
  web: () => import('./web').then((m) => new m.NativeAdPluginWeb()),
});

export * from './definitions';
export { NativeAdPlugin };
