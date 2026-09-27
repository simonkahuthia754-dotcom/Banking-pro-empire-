export interface NativeAdShowOptions {
  /** Your AdMob Native Advanced ad unit ID, e.g. ca-app-pub-XXXX/YYYY */
  adId: string;
  /** Left edge of the ad slot, in CSS pixels, from window.devicePixelRatio-aware getBoundingClientRect() */
  x: number;
  /** Top edge of the ad slot, in CSS pixels */
  y: number;
  /** Width of the ad slot, in CSS pixels */
  width: number;
  /** Height of the ad slot, in CSS pixels */
  height: number;
}

export interface NativeAdPluginPlugin {
  /** Loads a native ad for the given ad unit and displays it as a native overlay at the given screen rectangle. */
  showNativeAd(options: NativeAdShowOptions): Promise<{ shown: boolean }>;
  /** Removes the native ad overlay, if one is showing. */
  hideNativeAd(): Promise<void>;
  addListener(
    eventName: 'nativeAdLoaded' | 'nativeAdFailed',
    listenerFunc: (data: any) => void
  ): Promise<{ remove: () => void }>;
}
