import { AdMob, AppOpenAdPluginEvents } from '@capacitor-community/admob';

const INTERSTITIAL_AD_ID = 'ca-app-pub-2080882893991224/2651166330';
const APP_OPEN_AD_ID = 'ca-app-pub-2080882893991224/9216574681';

export async function initializeAdMob() {
  await AdMob.initialize({
    requestTrackingAuthorization: false,
    initializeForTesting: false,
  });
}

export async function prepareAppOpenAd() {
  try {
    await AdMob.prepareAppOpen({ adId: APP_OPEN_AD_ID });
  } catch (e) {
    console.warn('App Open Ad prepare failed:', e);
  }
}

export async function showAppOpenAd() {
  try {
    await AdMob.showAppOpenAd();
  } catch (e) {
    console.warn('App Open Ad show failed:', e);
  }
}

let interstitialReady = false;

export async function prepareInterstitialAd() {
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_ID });
    interstitialReady = true;
  } catch (e) {
    console.warn('Interstitial prepare failed:', e);
    interstitialReady = false;
  }
}

export async function showInterstitialAd() {
  if (!interstitialReady) {
    await prepareInterstitialAd();
  }
  try {
    await AdMob.showInterstitial();
    interstitialReady = false;
    prepareInterstitialAd();
  } catch (e) {
    console.warn('Interstitial show failed:', e);
  }
}
