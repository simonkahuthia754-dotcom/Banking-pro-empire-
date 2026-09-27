// AdMob integration for Banking Empire.
// Banner/Interstitial/Rewarded use @capacitor-community/admob. Native Advanced
// uses a custom local plugin (packages/capacitor-native-ad) since the community
// plugin doesn't support that format — see NativeAdPlugin.kt for why and how.
// Every function below is safe to call on web (e.g. `npm run dev`) — they all
// no-op there, since none of these ad formats can render outside a real
// installed Android app.

import { Capacitor } from '@capacitor/core';
import { NativeAdPlugin } from 'capacitor-native-ad';

let AdMob = null;
let BannerAdPosition = null;
let BannerAdSize = null;
let adsInitialized = false;
let bannerShown = false;
let lastInterstitialLevel = 0;
let rewardedLoading = false;
let nativeAdShown = false;

// ---- Your real AdMob IDs (App ID lives in capacitor.config.json) ----
const BANNER_AD_ID = 'ca-app-pub-1268492465575554/9075954325';
const REWARDED_AD_ID = 'ca-app-pub-1268492465575554/7954444343';
const NATIVE_ADVANCED_AD_ID = 'ca-app-pub-1268492465575554/9970322886';

// Still Google's public test ID — you didn't send an Interstitial ad unit,
// so create one in AdMob and swap this before you publish.
const INTERSTITIAL_AD_ID = 'ca-app-pub-3940256099942544/1033173712';

function isNative() {
  return Capacitor.isNativePlatform();
}

export async function initAds() {
  if (!isNative() || adsInitialized) return;
  try {
    const mod = await import('@capacitor-community/admob');
    AdMob = mod.AdMob;
    BannerAdPosition = mod.BannerAdPosition;
    BannerAdSize = mod.BannerAdSize;
    await AdMob.initialize({ initializeForTesting: false });
    adsInitialized = true;
  } catch (e) {
    console.warn('AdMob init failed (safe to ignore on web):', e);
  }
}

export async function showBanner() {
  if (!isNative() || !adsInitialized || bannerShown || !AdMob) return;
  try {
    await AdMob.showBanner({
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    });
    bannerShown = true;
  } catch (e) {
    console.warn('AdMob showBanner failed:', e);
  }
}

export async function hideBanner() {
  if (!isNative() || !bannerShown || !AdMob) return;
  try {
    await AdMob.hideBanner();
    bannerShown = false;
  } catch (e) {
    console.warn('AdMob hideBanner failed:', e);
  }
}

let interstitialLoading = false;
export async function showInterstitial() {
  if (!isNative() || !adsInitialized || !AdMob || interstitialLoading) return;
  try {
    interstitialLoading = true;
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_ID, isTesting: true });
    await AdMob.showInterstitial();
  } catch (e) {
    console.warn('AdMob showInterstitial failed:', e);
  } finally {
    interstitialLoading = false;
  }
}

export function maybeShowInterstitialForLevel(level) {
  if (level >= lastInterstitialLevel + 5) {
    lastInterstitialLevel = level;
    showInterstitial();
  }
}

// ---- Rewarded ads ----
// onReward(rewardType, rewardAmount) fires only if the viewer actually
// watched the whole thing — AdMob will not call this on early exit.
export async function showRewardedAd(onReward, onFail) {
  if (!isNative()) { onFail && onFail('not-native'); return; }
  if (!adsInitialized || !AdMob) { onFail && onFail('not-ready'); return; }
  if (rewardedLoading) { onFail && onFail('already-loading'); return; }
  try {
    rewardedLoading = true;
    const rewardListener = await AdMob.addListener('onRewardedVideoReward', (reward) => {
      onReward && onReward(reward?.type, reward?.amount);
      rewardListener.remove();
    });
    await AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_ID, isTesting: false });
    await AdMob.showRewardVideoAd();
  } catch (e) {
    console.warn('AdMob showRewardedAd failed:', e);
    onFail && onFail('error');
  } finally {
    rewardedLoading = false;
  }
}

// ---- Native Advanced ad ----
// `slotEl` is a DOM element already sitting in your layout at the size/position
// you want the ad to appear — this measures it with getBoundingClientRect()
// and asks the native plugin to overlay a real NativeAdView exactly on top of
// it. Call hideNativeAd() before the slot element unmounts (e.g. on tab change),
// since the overlay is a native view and won't unmount itself with React.
export async function showNativeAd(slotEl) {
  if (!isNative() || !slotEl) return;
  try {
    const rect = slotEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    await NativeAdPlugin.showNativeAd({
      adId: NATIVE_ADVANCED_AD_ID,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
    nativeAdShown = true;
  } catch (e) {
    console.warn('Native ad failed to show:', e);
  }
}

export async function hideNativeAd() {
  if (!isNative() || !nativeAdShown) return;
  try {
    await NativeAdPlugin.hideNativeAd();
    nativeAdShown = false;
  } catch (e) {
    console.warn('Native ad hide failed:', e);
  }
}
