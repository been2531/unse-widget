import {
  AdEventType,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// 테스트 ID — 출시 전 실제 AdMob Ad Unit ID로 교체
export const AD_UNIT_IDS = {
  rewarded: TestIds.REWARDED,
  banner:   TestIds.BANNER,
};

export { BannerAdSize };

export type AdResult = 'earned' | 'closed' | 'error';

export function showRewardedAd(): Promise<AdResult> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded);
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
