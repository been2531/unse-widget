import {
  BlurMask, Canvas, Circle, LinearGradient, Rect, vec,
} from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';

import { F } from '@/shared/fonts';
import { showRewardedAd } from '@/ads/admob';
import { CARD_POOL, RARITY_COLOR, RARITY_LABEL } from '@/gacha/types';
import { COINS_PER_AD, MAX_ADS_PER_DAY, getAdsRemaining, recordAdReward } from '@/storage/adRewards';
import { getBalance, spend } from '@/storage/coins';
import { hasRemovedAds } from '@/storage/purchases';
import { addToCollection, getCollection } from '@/storage/collection';
import { getTodayDateString } from '@/shared/dateUtils';

// ─── 스킨 상점 정의 ──────────────────────────────────────────────────────────
const SKIN_CARDS = CARD_POOL.filter(c => c.category === 'skin');
const SKIN_PRICES: Record<string, number> = {
  frame_ancient: 400,
  frame_silver:  400,
  frame_gold:    800,
  frame_dragon:  1500,
};

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

  const [balance, setBalance] = useState(0);
  const [adsRemaining, setAdsRemaining] = useState(0);
  const [adLoading, setAdLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [ownedSkinIds, setOwnedSkinIds] = useState<Set<string>>(new Set());
  const [adsRemoved, setAdsRemoved] = useState(false);

  useEffect(() => {
    Promise.all([getBalance(), getAdsRemaining(today), getCollection(), hasRemovedAds()]).then(([bal, ads, col, noAds]) => {
      setBalance(bal);
      setAdsRemaining(ads);
      setOwnedSkinIds(new Set(col.filter(c => c.category === 'skin').map(c => c.id)));
      setAdsRemoved(noAds);
    });
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
  async function handleBuySkin(cardId: string) {
    if (purchasing) return;
    const price = SKIN_PRICES[cardId] ?? 0;
    if (balance < price) {
      Alert.alert('코인 부족', `${price}코인이 필요합니다. 현재 ${balance}코인`);
      return;
    }
    const card = SKIN_CARDS.find(c => c.id === cardId);
    if (!card) return;
    setPurchasing(cardId);
    try {
      const newBal = await spend(price);
      await addToCollection([{ ...card, uid: `${cardId}_bought_${Date.now()}`, pulledAt: new Date().toISOString() }]);
      setBalance(newBal);
      setOwnedSkinIds(prev => new Set([...prev, cardId]));
      Alert.alert('구매 완료!', `${card.nameKo}를 획득했습니다.`);
    } catch (e: any) {
      Alert.alert('오류', e.message ?? '구매 중 오류가 발생했습니다.');
    }
    setPurchasing(null);
  }

  // ─── 광고 제거 구매 ────────────────────────────────────────────────────────
  async function handleRemoveAds() {
    if (purchasing || adsRemoved) return;
    setPurchasing('remove_ads');
    try {
      Alert.alert(
        '결제 준비 중',
        'Google Play Console 제품 등록 후 이용 가능합니다.\n\n스토어 출시 전 테스트 계정으로 먼저 확인해보세요.',
        [{ text: '확인' }],
      );
    } catch (e: any) {
      Alert.alert('결제 오류', e.message ?? '알 수 없는 오류');
    }
    setPurchasing(null);
  }

  // ─── 인앱 결제 ─────────────────────────────────────────────────────────────
  async function handlePurchase(sku: string, coins: number) {
    if (purchasing) return;
    setPurchasing(sku);
    try {
      // TODO: react-native-iap 연동 후 아래 코드로 교체
      // await initConnection();
      // await requestPurchase({ sku });
      // const purchase = await new Promise<Purchase>(...);
      // await finishTransaction({ purchase });
      // 코인 추가 로직

      // 임시: Play Console 미연동 안내
      Alert.alert(
        '결제 준비 중',
        'Google Play Console 제품 등록 후 이용 가능합니다.\n\n스토어 출시 전 테스트 계정으로 먼저 확인해보세요.',
        [{ text: '확인' }],
      );
    } catch (e: any) {
      Alert.alert('결제 오류', e.message ?? '알 수 없는 오류');
    }
    setPurchasing(null);
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
              <Text style={styles.packageLabel}>{pkg.label}</Text>
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
            {purchasing === pkg.sku
              ? <ActivityIndicator color={pkg.color} />
              : <Text style={[styles.packagePrice, { color: pkg.color }]}>{pkg.price}</Text>
            }
          </Pressable>
        ))}

        <Text style={styles.notice}>
          • 구매 후 코인은 즉시 지급됩니다{'\n'}
          • 환불은 Google Play 정책을 따릅니다{'\n'}
          • 미성년자 결제 주의
        </Text>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 스킨/프레임 상점 */}
        <Text style={styles.sectionTitle}>🖼️ 프레임 상점</Text>
        <Text style={styles.sectionSub}>코인으로 카드 프레임을 구매하세요. 가챠에서도 획득 가능!</Text>

        {SKIN_CARDS.map(skin => {
          const price = SKIN_PRICES[skin.id] ?? 0;
          const owned = ownedSkinIds.has(skin.id);
          return (
            <View key={skin.id} style={[styles.packageBtn, owned && { borderColor: 'rgba(0,220,100,0.45)', backgroundColor: 'rgba(0,220,100,0.04)' }]}>
              <Text style={{ fontSize: 28 }}>🖼️</Text>
              <View style={styles.packageInfo}>
                <Text style={styles.packageLabel}>{skin.nameKo}</Text>
                <Text style={{ color: RARITY_COLOR[skin.rarity], fontSize: 11, fontWeight: '700' }}>
                  {RARITY_LABEL[skin.rarity]}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }} numberOfLines={1}>{skin.description}</Text>
              </View>
              {owned
                ? <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,220,100,0.12)', borderRadius: 10 }}>
                    <Text style={{ color: '#00DD77', fontSize: 13, fontWeight: '700' }}>보유 중</Text>
                  </View>
                : <Pressable
                    style={[{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,220,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.3)', alignItems: 'center' }, balance < price && { opacity: 0.5 }]}
                    onPress={() => handleBuySkin(skin.id)}
                    disabled={!!purchasing || balance < price}
                    accessibilityLabel={`${skin.nameKo} 구매 ${price}코인`}
                  >
                    {purchasing === skin.id
                      ? <ActivityIndicator size="small" color="#FFE500" />
                      : <><Text style={{ color: '#FFE500', fontSize: 13, fontWeight: '800' }}>💰 {price}</Text></>
                    }
                  </Pressable>
              }
            </View>
          );
        })}
      </ScrollView>
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
  title: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  balanceBadge: {
    backgroundColor: 'rgba(255,220,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.35)',
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14,
  },
  balanceText: { color: '#FFE500', fontWeight: '700', fontSize: 13 },

  content: { paddingHorizontal: 20, paddingBottom: 48, gap: 12 },

  section: { gap: 8 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  sectionSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },

  adBtn: {
    backgroundColor: '#FFE500', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    alignItems: 'center', gap: 4,
    shadowColor: '#FFE500', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6,
  },
  adBtnDisabled: { opacity: 0.4 },
  adBtnText: { color: '#111', fontWeight: '900', fontSize: 16 },
  adBtnSub: { color: '#444', fontSize: 11 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },

  packageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16, padding: 16, position: 'relative',
  },
  packageHighlight: {
    borderColor: 'rgba(255,220,0,0.45)', backgroundColor: 'rgba(255,220,0,0.06)',
  },
  bestBadge: {
    position: 'absolute', top: -8, right: 12,
    backgroundColor: '#FFE500', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  bestText: { color: '#111', fontSize: 10, fontWeight: '900' },
  packageIcon: { fontSize: 28 },
  packageInfo: { flex: 1, gap: 4 },
  packageLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  packageCoins: { fontSize: 18, fontWeight: '900' },
  bonusBadge: {
    backgroundColor: 'rgba(0,220,100,0.15)', borderWidth: 1, borderColor: 'rgba(0,220,100,0.35)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  bonusText: { color: '#00DD77', fontSize: 10, fontWeight: '700' },
  packagePrice: { fontSize: 16, fontWeight: '800' },

  notice: { color: 'rgba(255,255,255,0.25)', fontSize: 11, lineHeight: 18, marginTop: 8 },

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
