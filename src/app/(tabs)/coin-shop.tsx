import {
  BlurMask, Canvas, Circle, LinearGradient, Rect, vec,
} from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _iap: any = null;
function iap() {
  if (!_iap) try { _iap = require('react-native-iap'); } catch { _iap = {}; }
  return _iap;
}
const initConnection        = (...a: any[]) => iap().initConnection?.(...a) ?? Promise.resolve();
const purchaseUpdatedListener = (...a: any[]) => iap().purchaseUpdatedListener?.(...a) ?? { remove: () => {} };
const purchaseErrorListener   = (...a: any[]) => iap().purchaseErrorListener?.(...a)   ?? { remove: () => {} };
const finishTransaction     = (...a: any[]) => iap().finishTransaction?.(...a) ?? Promise.resolve();
const requestPurchase       = (...a: any[]) => iap().requestPurchase?.(...a)  ?? Promise.resolve();

import { F } from '@/shared/fonts';
import { SkeletonBox } from '@/shared/Skeleton';
import { showRewardedAd } from '@/ads/admob';
import { COINS_PER_AD, MAX_ADS_PER_DAY, getAdsRemaining, recordAdReward } from '@/storage/adRewards';
import { addCoins, getBalance, spend } from '@/storage/coins';
import { grantRemoveAds, hasRemovedAds } from '@/storage/purchases';
import { getOwnedShopSkins, addShopSkin } from '@/storage/skinPurchases';
import { getEquippedFrame, setEquippedFrame } from '@/storage/equippedFrame';
import { getTodayDateString } from '@/shared/dateUtils';

// ─── 코인샵 전용 스킨 카탈로그 ───────────────────────────────────────────────
const SHOP_SKINS = [
  { id: 'shop_dokkaebi', nameKo: '도깨비 프레임', desc: '역동적인 붉은 화염, 도깨비의 기운',    price: 800,  color: '#FF3300' },
  { id: 'shop_phoenix',  nameKo: '봉황 프레임',   desc: '오색 불꽃의 봉황, 태양의 기운',        price: 900,  color: '#FF7700' },
  { id: 'shop_gumiho',   nameKo: '구미호 프레임',  desc: '달빛 아홉 꼬리, 황홀한 여우의 기운',  price: 1200, color: '#DD66FF' },
  { id: 'shop_samjogo',  nameKo: '삼족오 프레임',  desc: '태양 속 삼족오, 황금 태양의 기운',    price: 1500, color: '#FFB700' },
] as const;

// ─── IAP 패키지 정의 ──────────────────────────────────────────────────────────
// 실제 Google Play 제품 ID는 Play Console에서 생성 후 교체
const IAP_PACKAGES = [
  {
    sku: 'coins_100',
    coins: 100,
    price: '₩1,100',
    label: '소형 코인팩',
    bonus: '',
    color: '#4FC3F7',
    icon: '🪙',
  },
  {
    sku: 'coins_330',
    coins: 330,
    price: '₩2,900',
    label: '중형 코인팩',
    bonus: '+10% 보너스',
    color: '#FFE500',
    icon: '💰',
    highlight: true,
  },
  {
    sku: 'coins_1100',
    coins: 1100,
    price: '₩8,900',
    label: '대형 코인팩',
    bonus: '+20% 보너스',
    color: '#FF8800',
    icon: '💎',
  },
];

export default function CoinShopScreen() {
  const { width: screenW } = useWindowDimensions();
  const today = getTodayDateString();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [adsRemaining, setAdsRemaining] = useState(0);
  const [adLoading, setAdLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [ownedShopSkinIds, setOwnedShopSkinIds] = useState<Set<string>>(new Set());
  const [equippedFrameId, setEquippedFrameId] = useState<string | null>(null);
  const [adsRemoved, setAdsRemoved] = useState(false);

  useEffect(() => {
    Promise.all([getBalance(), getAdsRemaining(today), getOwnedShopSkins(), getEquippedFrame(), hasRemovedAds()])
      .then(([bal, ads, ownedSkins, frameId, noAds]) => {
        setBalance(bal);
        setAdsRemaining(ads);
        setOwnedShopSkinIds(ownedSkins);
        setEquippedFrameId(frameId);
        setAdsRemoved(noAds);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // IAP 연결 초기화
    initConnection().catch(() => {});

    const purchaseSub = purchaseUpdatedListener(async purchase => {
      try {
        const sku = purchase.productId;
        if (sku === 'remove_ads') {
          await grantRemoveAds();
          setAdsRemoved(true);
        } else {
          const pkg = IAP_PACKAGES.find(p => p.sku === sku);
          if (pkg) {
            const newBal = await addCoins(pkg.coins);
            setBalance(newBal);
          }
        }
        await finishTransaction({ purchase, isConsumable: sku !== 'remove_ads' });
        Alert.alert('결제 완료', sku === 'remove_ads' ? '광고 제거가 활성화되었습니다.' : '코인이 지급되었습니다!');
      } catch {
        Alert.alert('오류', '코인 지급 중 문제가 발생했습니다. 고객센터에 문의해주세요.');
      } finally {
        setPurchasing(null);
      }
    });

    const errorSub = purchaseErrorListener(err => {
      if ((err as any).code !== 'E_USER_CANCELLED') {
        Alert.alert('결제 오류', err.message ?? '알 수 없는 오류가 발생했습니다.');
      }
      setPurchasing(null);
    });

    return () => {
      purchaseSub.remove();
      errorSub.remove();
    };
  }, []);

  // ─── 광고 시청 ─────────────────────────────────────────────────────────────
  async function handleWatchAd() {
    if (adsRemaining <= 0 || adLoading) return;
    setAdLoading(true);
    try {
      const result = await showRewardedAd('gacha_free_pull');
      if (result === 'earned') {
        const newBal = await recordAdReward(today);
        setBalance(newBal);
        setAdsRemaining(prev => Math.max(0, prev - 1));
      } else if (result === 'error') {
        Alert.alert('오류', '광고를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      Alert.alert('오류', '코인 적립 중 오류가 발생했습니다.');
    } finally {
      setAdLoading(false);
    }
  }

  // ─── 스킨 구매 ────────────────────────────────────────────────────────────
  async function handleBuyShopSkin(id: string, price: number, nameKo: string) {
    if (purchasing) return;
    if (balance < price) {
      Alert.alert('코인 부족', `${price}코인이 필요합니다.\n현재 잔액: ${balance}코인`);
      return;
    }
    setPurchasing(id);
    try {
      const newBal = await spend(price);
      await addShopSkin(id);
      setBalance(newBal);
      setOwnedShopSkinIds(prev => new Set([...prev, id]));
      Alert.alert('구매 완료!', `${nameKo}를 획득했습니다.\n카드에 즉시 장착할 수 있습니다.`);
    } catch (e: any) {
      Alert.alert('오류', e.message ?? '구매 중 오류가 발생했습니다.');
    }
    setPurchasing(null);
  }

  // ─── 스킨 장착/해제 ───────────────────────────────────────────────────────
  async function handleEquipShopSkin(id: string) {
    const next = equippedFrameId === id ? null : id;
    await setEquippedFrame(next);
    setEquippedFrameId(next);
  }

  // ─── 광고 제거 구매 ────────────────────────────────────────────────────────
  async function handleRemoveAds() {
    if (purchasing || adsRemoved) return;
    setPurchasing('remove_ads');
    try {
      await requestPurchase({ sku: 'remove_ads' });
    } catch (e: any) {
      if ((e as any)?.code !== 'E_USER_CANCELLED') {
        Alert.alert('결제 오류', e.message ?? '알 수 없는 오류');
      }
      setPurchasing(null);
    }
  }

  // ─── 코인 인앱 결제 ────────────────────────────────────────────────────────
  async function handlePurchase(sku: string, _coins: number) {
    if (purchasing) return;
    setPurchasing(sku);
    try {
      await requestPurchase({ sku });
    } catch (e: any) {
      if ((e as any)?.code !== 'E_USER_CANCELLED') {
        Alert.alert('결제 오류', e.message ?? '알 수 없는 오류');
      }
      setPurchasing(null);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />
      {/* 배경 */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={screenW} height={9999}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 500)} colors={['#0E0B22', '#080B18']} />
        </Rect>
        <Circle cx={screenW * 0.5} cy={120} r={screenW * 0.5} color="rgba(255,180,0,0.08)">
          <BlurMask blur={80} style="normal" />
        </Circle>
      </Canvas>

      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="뒤로 가기">
          <View style={styles.chevron} />
        </Pressable>
        <Text style={styles.title}>코인 충전</Text>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>💰 {balance.toLocaleString()}</Text>
        </View>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} overScrollMode="never">
          <SkeletonBox style={{ height: 80, borderRadius: 18 }} />
          <SkeletonBox style={{ height: 1, borderRadius: 1, marginVertical: 8 }} />
          <SkeletonBox style={{ height: 24, borderRadius: 6, width: 160 }} />
          <SkeletonBox style={{ height: 56, borderRadius: 16 }} />
          <SkeletonBox style={{ height: 1, borderRadius: 1, marginVertical: 8 }} />
          <SkeletonBox style={{ height: 24, borderRadius: 6, width: 120 }} />
          {[0,1,2].map(i => <SkeletonBox key={i} style={{ height: 72, borderRadius: 16 }} />)}
          <SkeletonBox style={{ height: 1, borderRadius: 1, marginVertical: 8 }} />
          <SkeletonBox style={{ height: 24, borderRadius: 6, width: 140 }} />
          {[0,1,2,3].map(i => <SkeletonBox key={i} style={{ height: 72, borderRadius: 16 }} />)}
        </ScrollView>
      ) : (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} overScrollMode="never">

        {/* 광고 제거 상품 */}
        <Pressable
          style={[styles.removeAdsBtn, adsRemoved && styles.removeAdsBtnOwned]}
          onPress={handleRemoveAds}
          disabled={!!purchasing || adsRemoved}
          accessibilityLabel={adsRemoved ? '광고 제거 이미 구매됨' : '광고 제거 구매 4900원'}
        >
          <View style={styles.removeAdsLeft}>
            <Text style={styles.removeAdsTitle}>🚫 광고 제거</Text>
            <Text style={styles.removeAdsSub}>
              {adsRemoved ? '이미 구매하셨습니다' : '운세 잠금 해제 시 광고 없이 코인 차감으로 이용'}
            </Text>
          </View>
          {adsRemoved
            ? <View style={styles.ownedBadge}><Text style={styles.ownedText}>보유 중</Text></View>
            : purchasing === 'remove_ads'
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.removeAdsPrice}>₩4,900</Text>
          }
        </Pressable>

        <View style={styles.divider} />

        {/* 광고 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📺 광고 보고 코인 받기</Text>
          <Text style={styles.sectionSub}>하루 {MAX_ADS_PER_DAY}회 · 1회당 +{COINS_PER_AD}코인</Text>
          <Pressable
            style={[styles.adBtn, (adsRemaining <= 0 || adLoading) && styles.adBtnDisabled]}
            onPress={handleWatchAd}
            disabled={adsRemaining <= 0 || adLoading}
            accessibilityLabel={adsRemaining > 0 ? `광고 보기 ${COINS_PER_AD}코인 획득, 오늘 ${adsRemaining}회 남음` : '오늘 광고 모두 시청 완료'}
          >
            {adLoading
              ? <><ActivityIndicator color="#111" size="small" /><Text style={styles.adBtnText}>광고 로딩 중...</Text></>
              : <>
                  <Text style={styles.adBtnText}>
                    {adsRemaining > 0 ? `광고 보기  +${COINS_PER_AD}코인` : '오늘 광고 모두 시청 완료'}
                  </Text>
                  <Text style={styles.adBtnSub}>{adsRemaining}/{MAX_ADS_PER_DAY} 남음</Text>
                </>
            }
          </Pressable>
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* IAP 패키지 */}
        <Text style={styles.sectionTitle}>💎 코인 구매</Text>
        <Text style={styles.sectionSub}>Google Play를 통한 안전한 결제</Text>

        {IAP_PACKAGES.map(pkg => (
          <Pressable
            key={pkg.sku}
            style={[styles.packageBtn, pkg.highlight && styles.packageHighlight]}
            onPress={() => handlePurchase(pkg.sku, pkg.coins)}
            disabled={!!purchasing}
            accessibilityLabel={`${pkg.label} ${pkg.coins.toLocaleString()}코인 구매`}
          >
            {pkg.highlight && (
              <View style={styles.bestBadge}><Text style={styles.bestText}>인기</Text></View>
            )}
            <Text style={styles.packageIcon}>{pkg.icon}</Text>
            <View style={styles.packageInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.packageCoins, { color: pkg.color }]}>
                  {pkg.coins.toLocaleString()}코인
                </Text>
                {pkg.bonus ? (
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusText}>{pkg.bonus}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <Text style={styles.packageLabel}>{pkg.label}</Text>
              {purchasing === pkg.sku
                ? <ActivityIndicator color={pkg.color} />
                : <Text style={[styles.packagePrice, { color: pkg.color }]}>{pkg.price}</Text>
              }
            </View>
          </Pressable>
        ))}

        <Text style={styles.notice}>
          • 구매 후 코인은 즉시 지급됩니다{'\n'}
          • 환불은 Google Play 정책을 따릅니다{'\n'}
          • 미성년자 결제 주의
        </Text>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 코인샵 전용 스킨 */}
        <Text style={styles.sectionTitle}>🖼️ 프레임 상점</Text>
        <Text style={styles.sectionSub}>한국신화 테마 전용 프레임 · 코인으로 구매 후 즉시 장착</Text>

        {SHOP_SKINS.map(skin => {
          const owned = ownedShopSkinIds.has(skin.id);
          const equipped = equippedFrameId === skin.id;
          return (
            <View
              key={skin.id}
              style={[
                styles.packageBtn,
                owned && { borderColor: `${skin.color}55`, backgroundColor: `${skin.color}0A` },
                equipped && { borderColor: skin.color, borderWidth: 1.5 },
              ]}
            >
              {equipped && (
                <View style={[styles.bestBadge, { backgroundColor: skin.color }]}>
                  <Text style={styles.bestText}>장착 중</Text>
                </View>
              )}
              {/* 글로우 컬러 도트 */}
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${skin.color}22`, borderWidth: 2, borderColor: skin.color, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: skin.color, opacity: 0.85 }} />
              </View>
              <View style={styles.packageInfo}>
                <Text style={[styles.packageLabel, { fontFamily: F.eb, color: skin.color }]}>{skin.nameKo}</Text>
                <Text style={{ fontFamily: F.r, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{skin.desc}</Text>
              </View>
              {owned
                ? <Pressable
                    style={[styles.equipBtn, equipped && { borderColor: skin.color, backgroundColor: `${skin.color}22` }]}
                    onPress={() => handleEquipShopSkin(skin.id)}
                  >
                    <Text style={[styles.equipBtnText, { fontFamily: F.b, color: equipped ? skin.color : 'rgba(255,255,255,0.55)' }]}>
                      {equipped ? '해제' : '장착'}
                    </Text>
                  </Pressable>
                : <Pressable
                    style={[styles.buyBtn, balance < skin.price && { opacity: 0.45 }]}
                    onPress={() => handleBuyShopSkin(skin.id, skin.price, skin.nameKo)}
                    disabled={!!purchasing || balance < skin.price}
                    accessibilityLabel={`${skin.nameKo} ${skin.price}코인으로 구매`}
                  >
                    {purchasing === skin.id
                      ? <ActivityIndicator size="small" color={skin.color} />
                      : <Text style={[styles.buyBtnText, { fontFamily: F.eb, color: skin.color }]}>💰 {skin.price}</Text>
                    }
                  </Pressable>
              }
            </View>
          );
        })}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080B18' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  chevron: {
    width: 10, height: 10,
    borderLeftWidth: 2, borderBottomWidth: 2,
    borderColor: '#FFF',
    transform: [{ rotate: '45deg' }, { translateX: 2 }],
  },
  title: { fontFamily: F.eb, fontSize: 18, color: '#FFF' },
  balanceBadge: {
    backgroundColor: 'rgba(255,220,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.35)',
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14,
  },
  balanceText: { fontFamily: F.b, color: '#FFE500', fontSize: 13 },

  content: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },

  section: { gap: 8 },
  sectionTitle: { fontFamily: F.eb, color: '#FFF', fontSize: 16, borderLeftWidth: 3, borderLeftColor: '#C8A84B', paddingLeft: 10 },
  sectionSub: { fontFamily: F.r, color: 'rgba(255,255,255,0.45)', fontSize: 12, paddingLeft: 13 },

  adBtn: {
    backgroundColor: '#FFE500', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    alignItems: 'center', gap: 4,
    shadowColor: '#FFE500', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6,
  },
  adBtnDisabled: { opacity: 0.4 },
  adBtnText: { fontFamily: F.bk, color: '#111', fontSize: 16 },
  adBtnSub: { fontFamily: F.r, color: '#444', fontSize: 11 },

  divider: { height: 1, backgroundColor: 'rgba(200,168,75,0.18)', marginVertical: 8 },

  packageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16, padding: 16, position: 'relative',
  },
  packageHighlight: {
    borderColor: 'rgba(255,220,0,0.45)',
  },
  bestBadge: {
    position: 'absolute', top: -8, right: 12,
    backgroundColor: '#FFE500', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  bestText: { fontFamily: F.bk, color: '#111', fontSize: 10 },
  packageIcon: { fontSize: 28 },
  packageInfo: { flex: 1, gap: 2 },
  packageLabel: { fontFamily: F.r, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  packageCoins: { fontFamily: F.bk, fontSize: 18 },
  bonusBadge: {
    backgroundColor: 'rgba(0,200,80,0.28)', borderWidth: 1, borderColor: 'rgba(0,220,100,0.7)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  bonusText: { fontFamily: F.b, color: '#00EE88', fontSize: 10 },
  packagePrice: { fontFamily: F.eb, fontSize: 16 },

  notice: { fontFamily: F.r, color: 'rgba(255,255,255,0.25)', fontSize: 11, lineHeight: 18, marginTop: 8 },

  buyBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', minWidth: 80,
  },
  buyBtnText: { fontFamily: F.eb, fontSize: 13 },
  equipBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', minWidth: 52,
  },
  equipBtnText: { fontFamily: F.b, fontSize: 13 },

  removeAdsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(100,80,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(120,100,255,0.45)',
    borderRadius: 18, padding: 18, gap: 12,
  },
  removeAdsBtnOwned: { borderColor: 'rgba(0,220,100,0.35)', backgroundColor: 'rgba(0,220,100,0.06)' },
  removeAdsLeft: { flex: 1, gap: 4 },
  removeAdsTitle: { color: '#FFF', fontSize: 16, fontFamily: F.eb },
  removeAdsSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: F.r },
  removeAdsPrice: { color: '#B89AFF', fontSize: 18, fontFamily: F.bk },
  ownedBadge: {
    backgroundColor: 'rgba(0,220,100,0.15)', borderWidth: 1, borderColor: 'rgba(0,220,100,0.4)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  ownedText: { color: '#00DD77', fontSize: 12, fontFamily: F.b },
});
