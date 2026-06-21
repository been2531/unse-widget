// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _m: any = null;
function ads() {
  if (!_m) try { _m = require('react-native-google-mobile-ads'); } catch { _m = {}; }
  return _m;
}

const IS_DEV = __DEV__;

export const AD_UNIT_IDS = {
  fortune_unlock: IS_DEV
    ? 'ca-app-pub-3940256099942544/5224354917'
    : 'ca-app-pub-4631230760372985/9450833816',
  gacha_free_pull: IS_DEV
    ? 'ca-app-pub-3940256099942544/5224354917'
    : 'ca-app-pub-4631230760372985/3395571673',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BannerAdSize: any = new Proxy({}, { get: (_, k) => ads()?.BannerAdSize?.[k as string] });

export type AdResult = 'earned' | 'closed' | 'error';
export type AdUnitKey = keyof typeof AD_UNIT_IDS;

export function showRewardedAd(unit: AdUnitKey = 'fortune_unlock'): Promise<AdResult> {
  return new Promise((resolve) => {
    const m = ads();
    if (!m?.RewardedAd) { resolve('error'); return; }

    const ad = m.RewardedAd.createForAdRequest(AD_UNIT_IDS[unit]);
    let earned = false;

    const unsubEarned = ad.addAdEventListener(m.RewardedAdEventType.EARNED_REWARD, () => { earned = true; });
    const unsubLoaded = ad.addAdEventListener(m.RewardedAdEventType.LOADED, () => { ad.show(); });
    const unsubClosed = ad.addAdEventListener(m.AdEventType.CLOSED, () => {
      unsubEarned(); unsubLoaded(); unsubClosed(); unsubError();
      resolve(earned ? 'earned' : 'closed');
    });
    const unsubError = ad.addAdEventListener(m.AdEventType.ERROR, () => {
      unsubEarned(); unsubLoaded(); unsubClosed(); unsubError();
      resolve('error');
    });

    ad.load();
  });
}
