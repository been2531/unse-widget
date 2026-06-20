import {
  AdEventType,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const IS_DEV = __DEV__;

export const AD_UNIT_IDS = {
  fortune_unlock: IS_DEV
    ? TestIds.REWARDED
    : 'ca-app-pub-4631230760372985/9450833816',
  gacha_free_pull: IS_DEV
    ? TestIds.REWARDED
    : 'ca-app-pub-4631230760372985/3395571673',
};

export { BannerAdSize };

export type AdResult = 'earned' | 'closed' | 'error';
export type AdUnitKey = keyof typeof AD_UNIT_IDS;

export function showRewardedAd(unit: AdUnitKey = 'fortune_unlock'): Promise<AdResult> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS[unit]);
    let earned = false;

    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      ad.show();
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      unsubEarned(); unsubLoaded(); unsubClosed(); unsubError();
      resolve(earned ? 'earned' : 'closed');
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubEarned(); unsubLoaded(); unsubClosed(); unsubError();
      resolve('error');
    });

    ad.load();
  });
}
