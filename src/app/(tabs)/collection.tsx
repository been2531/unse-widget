import {
  BlurMask, Canvas, Circle, Group, Image as SkiaImage,
  LinearGradient, RadialGradient, Rect, RoundedRect, Skia, vec, useImage,
} from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList, Modal, Pressable, ScrollView, Share,
  StatusBar, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';

import { F } from '@/shared/fonts';
import { cardImageFor } from '@/gacha/cardAssets';
import {
  CARD_POOL, CATEGORY_LABEL, RARITY_COLOR, RARITY_LABEL,
  type CardCategory, type CardDef, type PulledCard,
} from '@/gacha/types';
import { FORTUNE_CARD_BUFFS } from '@/fortune/fortuneCardBuff';
import { getCollection } from '@/storage/collection';
import { getEquippedFrame, setEquippedFrame } from '@/storage/equippedFrame';

const ELEM_COLOR: Record<string, string> = {
  fire: '#FF6600', water: '#00AAFF', lightning: '#FFE500',
  nature: '#44FF88', dark: '#CC44FF', light: '#FFD700',
};
const ELEM_LABEL: Record<string, string> = {
  fire: '🔥', water: '💧', lightning: '⚡', nature: '🌿', dark: '🌑', light: '✨',
};
const ELEM_BG: Record<string, [string, string]> = {
  fire: ['#2a0800', '#180400'], water: ['#001828', '#000e18'],
  lightning: ['#12103a', '#0c1e3e'], nature: ['#082010', '#041008'],
  dark: ['#100820', '#080412'], light: ['#1a1400', '#100c00'],
};
const RARITY_ORDER: Record<string, number> = { mythic: 0, legendary: 1, epic: 2, rare: 3, common: 4 };

// 캐릭터 패밀리별 이모지 (이미지 없을 때 폴백)
const FAMILY_EMOJI: Record<string, string> = {
  fire: '🐲', water: '🐲', lightning: '🐲', nature: '🐲', dark: '🐲', light: '🐲',
  gumiho: '🦊', imugi: '🐍', samjogo: '🐦', bonghwang: '🕊️', dokkaebi: '👺', haetae: '🦁',
};
function cardEmoji(card: CardDef): string {
  if (card.category === 'fortune') return '🔮';
  if (card.category === 'skin') return '🖼️';
  const family = card.id.split('_')[0];
  return FAMILY_EMOJI[family] ?? FAMILY_EMOJI[card.element] ?? '✨';
}

type Filter = 'character' | 'fortune' | 'skin' | 'all';
type ElemFilter = 'all' | 'fire' | 'water' | 'lightning' | 'nature' | 'dark' | 'light';

const ALL_CHARS = CARD_POOL.filter(c => c.category === 'character');
const ALL_SKINS = CARD_POOL.filter(c => c.category === 'skin');

const ELEM_FILTERS: { key: ElemFilter; label: string }[] = [
  { key: 'all',       label: '전체' },
  { key: 'fire',      label: '🔥 화염' },
  { key: 'water',     label: '💧 물' },
  { key: 'lightning', label: '⚡ 번개' },
  { key: 'nature',    label: '🌿 자연' },
  { key: 'dark',      label: '🌑 암흑' },
  { key: 'light',     label: '✨ 빛' },
];

// ─── 그리드 카드 아이템 ────────────────────────────────────────────────────────
type AnyCardItem = {
  id: string; uid: string; element: string;
  category: string; rarity: string; name: string;
  nameKo: string; description: string; pulledAt: string;
  owned?: boolean;
};

function CardItem({ item, CARD_W, CARD_H, onPress }: {
  item: AnyCardItem;
  CARD_W: number;
  CARD_H: number;
  onPress: (item: AnyCardItem) => void;
}) {
  const owned = item.owned !== false;
  const elemColor = ELEM_COLOR[item.element] ?? '#888';
  const imgSrc = (item.category === 'character' || item.category === 'skin')
    ? cardImageFor(item.element, item.rarity, item.id)
    : null;
  const skiaImg = useImage(imgSrc);
  const CW = CARD_W - 8;
  const CH = CARD_H - 8;
  const LABEL_H = CH * 0.38; // 텍스트 오버레이 영역 (하단 38%)

  return (
    <Pressable style={{ width: CARD_W, height: CARD_H, padding: 4 }} onPress={() => onPress(item)} accessibilityLabel={`${item.nameKo} 카드${owned ? '' : ' 미보유'}`}>
      <View style={{
        flex: 1, borderRadius: 10, overflow: 'hidden',
        borderWidth: 1,
        borderColor: owned ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
      }}>
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* 배경 */}
          <Rect x={0} y={0} width={CW} height={CH}>
            <LinearGradient start={vec(0, 0)} end={vec(CW, CH)} colors={['#111326', '#080B1A']} />
          </Rect>
          {/* 원소 글로우 */}
          {owned && (
            <Circle cx={CW / 2} cy={CH * 0.40} r={CW * 0.28} color={`${elemColor}18`}>
              <BlurMask blur={18} style="normal" />
            </Circle>
          )}
          {/* 캐릭터 아트 — 카드 전체 높이 */}
          {skiaImg && (
            <Group clip={Skia.RRectXY(Skia.XYWHRect(0, 0, CW, CH), 8, 8)} opacity={owned ? 1 : 0.45}>
              <SkiaImage image={skiaImg} x={0} y={0} width={CW} height={CH} fit="cover" />
              {/* 하단 그라디언트 — 텍스트 가독성 */}
              <Rect x={0} y={CH - LABEL_H} width={CW} height={LABEL_H}>
                <LinearGradient
                  start={vec(0, CH - LABEL_H)} end={vec(0, CH)}
                  colors={['rgba(6,8,20,0)', 'rgba(6,8,20,0.97)']}
                />
              </Rect>
            </Group>
          )}
          {/* 이미지 없는 카드(운세 등): 하단 페이드만 */}
          {!imgSrc && (
            <Rect x={0} y={CH - LABEL_H} width={CW} height={LABEL_H}>
              <LinearGradient
                start={vec(0, CH - LABEL_H)} end={vec(0, CH)}
                colors={['rgba(6,8,20,0)', 'rgba(6,8,20,0.85)']}
              />
            </Rect>
          )}
          {/* 미수집 안개 — 상단 옅고 하단 짙은 그라디언트 */}
          {!owned && (
            <Rect x={0} y={0} width={CW} height={CH}>
              <LinearGradient
                start={vec(CW / 2, 0)} end={vec(CW / 2, CH)}
                colors={['rgba(5,4,18,0.20)', 'rgba(5,4,18,0.68)']}
              />
            </Rect>
          )}
          {/* 소유 카드 등급별 처리 */}
          {owned && item.rarity === 'common' && (
            <Rect x={0} y={0} width={CW} height={CH} color="rgba(8,6,20,0.28)" />
          )}
          {owned && item.rarity === 'rare' && (
            <Rect x={0} y={0} width={CW} height={CH} color="rgba(8,6,20,0.12)" />
          )}
          {owned && (item.rarity === 'legendary' || item.rarity === 'mythic') && (
            <Rect x={0} y={0} width={CW} height={CH}>
              <RadialGradient
                c={vec(CW / 2, CH * 0.42)}
                r={CW * 0.62}
                colors={[`${elemColor}00`, `${elemColor}00`, `${elemColor}16`]}
                positions={[0, 0.55, 1]}
              />
            </Rect>
          )}
        </Canvas>
        {/* 이미지 없을 때 이모지 중앙 */}
        {!imgSrc && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: LABEL_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: CARD_W * 0.26 }}>{cardEmoji(item as any)}</Text>
          </View>
        )}
        {/* 텍스트 오버레이 — 카드 하단 고정 */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: LABEL_H,
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: 8, paddingHorizontal: 4, gap: 2,
        }}>
          <Text style={{ fontFamily: F.b, color: '#fff', fontSize: 9, textAlign: 'center', lineHeight: 13 }} numberOfLines={1}>
            {item.nameKo}
          </Text>
          <Text style={{ fontFamily: F.sb, color: RARITY_COLOR[item.rarity as keyof typeof RARITY_COLOR], fontSize: 8, lineHeight: 12 }}>
            {RARITY_LABEL[item.rarity as keyof typeof RARITY_LABEL]}
          </Text>
          {!owned && (
            <Text style={{ fontFamily: F.r, color: 'rgba(255,255,255,0.35)', fontSize: 7, lineHeight: 11 }}>미수집</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── 카드 상세 모달 ────────────────────────────────────────────────────────────
type ModalItem = (CardDef & { owned: boolean }) | PulledCard;

function CardDetailModal({ item, equippedFrameId, onClose, onEquipChanged }: {
  item: ModalItem;
  equippedFrameId: string | null;
  onClose: () => void;
  onEquipChanged: (frameId: string | null) => void;
}) {
  const elemColor = ELEM_COLOR[item.element] ?? '#888';
  const [bgTop, bgBot] = ELEM_BG[item.element] ?? ['#12103a', '#0c1e3e'];
  const imgSrc = (item.category === 'character' || item.category === 'skin')
    ? cardImageFor(item.element, item.rarity, item.id)
    : null;
  const owned = 'owned' in item ? item.owned : true;
  const skiaImg = useImage(imgSrc);
  const isSkin = item.category === 'skin';
  const isEquipped = equippedFrameId === item.id;

  async function handleEquip() {
    const nextId = isEquipped ? null : item.id;
    await setEquippedFrame(nextId);
    onEquipChanged(nextId);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.container} onPress={e => e.stopPropagation()}>
          {/* 카드 */}
          <View style={[modalStyles.card, { borderColor: 'rgba(255,255,255,0.12)' }]}>
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              <Rect x={0} y={0} width={220} height={312}>
                <LinearGradient start={vec(0, 0)} end={vec(220, 312)} colors={[bgTop, bgBot]} />
              </Rect>
              <Circle cx={110} cy={100} r={80} color={`${elemColor}22`}>
                <BlurMask blur={28} style="normal" />
              </Circle>
              {skiaImg && (
                <Group clip={Skia.RRectXY(Skia.XYWHRect(10, 8, 200, 185), 10, 10)}>
                  <SkiaImage image={skiaImg} x={10} y={8} width={200} height={185} fit="cover" />
                </Group>
              )}
              <RoundedRect x={0} y={0} width={220} height={312} r={14}
                color="rgba(255,255,255,0.10)" style="stroke" strokeWidth={1} />
            </Canvas>

            {!imgSrc && (
              <View style={{ position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center', height: 185, justifyContent: 'center' }}>
                <Text style={{ fontSize: 72 }}>{cardEmoji(item as any)}</Text>
              </View>
            )}

            <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: F.eb, color: '#fff', fontSize: 16 }}>
                {item.nameKo}
              </Text>
              <Text style={{ fontFamily: F.r, color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 0.5 }}>{item.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Text style={{ fontFamily: F.b, color: RARITY_COLOR[item.rarity], fontSize: 11 }}>
                  {RARITY_LABEL[item.rarity]}
                </Text>
                <Text style={{ fontFamily: F.r, color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</Text>
                <Text style={{ fontFamily: F.r, color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                  {CATEGORY_LABEL[item.category]}
                </Text>
              </View>
              {!owned && (
                <Text style={{ fontFamily: F.r, color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>미수집</Text>
              )}
            </View>
          </View>

          {/* 설명 */}
          <View style={[modalStyles.descBox, { borderColor: `${elemColor}22` }]}>
            <View style={modalStyles.mythBadgeRow}>
              <View style={[modalStyles.mythBadge, { backgroundColor: `${elemColor}18`, borderColor: `${elemColor}44` }]}>
                <Text style={[modalStyles.mythBadgeText, { color: elemColor }]}>한국신화</Text>
              </View>
              <Text style={modalStyles.elemLabel}>
                {ELEM_LABEL[item.element]} {item.element === 'fire' ? '화염' : item.element === 'water' ? '물' : item.element === 'lightning' ? '번개' : item.element === 'nature' ? '자연' : item.element === 'dark' ? '암흑' : '빛'}
              </Text>
            </View>
            <Text style={modalStyles.desc}>{item.description}</Text>
            {'pulledAt' in item && item.pulledAt ? (
              <Text style={modalStyles.pullDate}>
                수집일: {new Date(item.pulledAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            ) : null}
          </View>

          {/* 운세 카드 버프 정보 */}
          {item.category === 'fortune' && (() => {
            const buff = FORTUNE_CARD_BUFFS[item.id];
            if (!buff) return null;
            const CAT_LABEL: Record<string, string> = { wealth: '재물운', love: '연애운', health: '건강운', work: '직장운', all: '전체 운세' };
            return (
              <View style={[modalStyles.buffBox, { borderColor: `${buff.color}44`, backgroundColor: `${buff.color}0E` }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={{ fontSize: 18 }}>{buff.emoji}</Text>
                  <View>
                    <Text style={{ fontFamily: F.b, color: buff.color, fontSize: 12 }}>버프 효과 — {CAT_LABEL[buff.affectedCategory]}</Text>
                    <Text style={{ fontFamily: F.r, color: 'rgba(255,255,255,0.30)', fontSize: 10 }}>가챠에서 뽑은 날 하루 적용</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: F.r, color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 18 }}>{buff.bonusText}</Text>
              </View>
            );
          })()}

          {isSkin && owned && (
            <Pressable
              style={[modalStyles.equipBtn, isEquipped
                ? { backgroundColor: `${elemColor}28`, borderColor: elemColor }
                : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.18)' }
              ]}
              onPress={handleEquip}
              accessibilityLabel={isEquipped ? '프레임 해제' : '프레임 장착'}
            >
              <Text style={[modalStyles.equipBtnText, { color: isEquipped ? elemColor : 'rgba(255,255,255,0.7)' }]}>
                {isEquipped ? '✓ 장착 중 — 해제하기' : '프레임 장착'}
              </Text>
            </Pressable>
          )}

          <Pressable style={[modalStyles.closeBtn, { borderColor: `${elemColor}55` }]} onPress={onClose}>
            <Text style={[modalStyles.closeBtnText, { color: elemColor }]}>확인</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function CollectionScreen() {
  const { width: screenW } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('character');
  const [elemFilter, setElemFilter] = useState<ElemFilter>('all');
  const [collected, setCollected] = useState<PulledCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ModalItem | null>(null);
  const [equippedFrameId, setEquippedFrameId] = useState<string | null>(null);

  useEffect(() => {
    getCollection().then(setCollected);
    getEquippedFrame().then(setEquippedFrameId);
  }, []);

  const collectedIds = new Set(collected.map(c => c.id));

  const characterItems = ALL_CHARS.map(c => ({
    ...c, uid: c.id, pulledAt: '', owned: collectedIds.has(c.id),
  }));
  const skinItems = ALL_SKINS.map(c => ({
    ...c, uid: c.id, pulledAt: '', owned: collectedIds.has(c.id),
  }));
  const fortuneItems = collected
    .filter(c => c.category === 'fortune')
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
  const allItems = [...collected].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);

  const filteredCharItems = elemFilter === 'all'
    ? characterItems
    : characterItems.filter(c => c.element === elemFilter);

  const COLS = 3;
  const CARD_W = (screenW - 48) / COLS;
  const CARD_H = CARD_W * 1.42;

  const data = filter === 'character' ? filteredCharItems
    : filter === 'fortune' ? fortuneItems
    : filter === 'skin' ? skinItems
    : allItems;

  const ownedCount = filter === 'character' ? filteredCharItems.filter(c => c.owned).length
    : filter === 'skin' ? skinItems.filter(c => c.owned).length
    : data.length;
  const totalCount = filter === 'character' ? filteredCharItems.length
    : filter === 'skin' ? ALL_SKINS.length
    : null;

  // 전체 캐릭터 수집률 (원소 필터 무관)
  const totalCharOwned = characterItems.filter(c => c.owned).length;
  const totalCharAll = ALL_CHARS.length;
  const completionPct = totalCharAll > 0 ? totalCharOwned / totalCharAll : 0;

  async function shareCollection() {
    const pct = Math.round(completionPct * 100);
    const msg = pct >= 100
      ? `[UNSE 카드 수집] 🎉 ${totalCharAll}/${totalCharAll} 전체 수집 완료!\n한국신화 카드 도감을 완성했습니다! ✨`
      : `[UNSE 카드 수집]\n캐릭터 수집률 ${totalCharOwned}/${totalCharAll} (${pct}%)\n한국신화를 담은 운세 카드 앱 UNSE에서 카드를 모아보세요! ✨`;
    try { await Share.share({ message: msg }); } catch {}
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'character', label: '캐릭터' },
    { key: 'fortune',   label: '운세 카드' },
    { key: 'skin',      label: '스킨' },
    { key: 'all',       label: '전체' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={screenW} height={9999}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 400)} colors={['#0E0B22', '#080B18']} />
        </Rect>
      </Canvas>

      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="뒤로 가기">
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>내 컬렉션</Text>
        <Text style={styles.countBadge}>
          {totalCount !== null ? `${ownedCount}/${totalCount}` : `${ownedCount}장`}
        </Text>
      </View>

      <FlatList
        data={data as AnyCardItem[]}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <CardItem
            item={item}
            CARD_W={CARD_W}
            CARD_H={CARD_H}
            onPress={item => setSelectedCard(item as any)}
          />
        )}
        numColumns={COLS}
        key={`${filter}-${elemFilter}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        ListHeaderComponent={
          <View style={{ marginHorizontal: -16 }}>
            {/* 수집률 진행 바 */}
            <View style={styles.progressWrap}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>캐릭터 수집률</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.progressCount}>{totalCharOwned} / {totalCharAll}</Text>
                  <Pressable onPress={shareCollection} style={styles.shareBtn} accessibilityLabel="수집률 공유하기">
                    <Text style={styles.shareBtnText}>↗</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(completionPct * 100)}%` as any }]} />
              </View>
            </View>

            {/* 카테고리 필터 탭 — 언더라인 스타일 */}
            <View style={styles.tabTrack}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer} style={{ flexGrow: 0 }}>
                {FILTERS.map(({ key, label }) => (
                  <Pressable key={key}
                    style={[styles.tab, filter === key && styles.tabActive]}
                    onPress={() => { setFilter(key); setElemFilter('all'); }}>
                    <Text style={[styles.tabText, filter === key && styles.tabTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* 원소 필터 — 캐릭터 탭에서만 */}
            {filter === 'character' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.elemTabsContainer} style={{ flexGrow: 0 }}>
                {ELEM_FILTERS.map(({ key, label }) => {
                  const color = key !== 'all' ? (ELEM_COLOR[key] ?? '#888') : undefined;
                  const isActive = elemFilter === key;
                  return (
                    <Pressable key={key}
                      style={[styles.elemTab, isActive && { borderColor: color ? `${color}99` : 'rgba(255,255,255,0.55)', backgroundColor: color ? `${color}18` : 'rgba(255,255,255,0.10)' }]}
                      onPress={() => setElemFilter(key)}>
                      <Text style={[styles.elemTabText, isActive && { color: color ?? '#FFF', fontFamily: F.sb }]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>
              {filter === 'fortune' ? '🔮' : filter === 'skin' ? '🖼️' : elemFilter !== 'all' ? ELEM_LABEL[elemFilter] : '✨'}
            </Text>
            <Text style={styles.emptyTitle}>
              {filter === 'fortune' ? '운세 카드 없음'
                : filter === 'skin' ? '보유한 프레임 없음'
                : elemFilter !== 'all' ? `${ELEM_LABEL[elemFilter]} 계열 카드 없음`
                : '아직 카드가 없어요'}
            </Text>
            <Text style={styles.emptySub}>
              {filter === 'fortune' ? '가챠 뽑기로 운세 카드를 획득할 수 있어요'
                : filter === 'skin' ? '코인샵에서 프레임을 구매해보세요'
                : '가챠에서 카드를 뽑아보세요!'}
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push(filter === 'skin' ? '/coin-shop' : '/gacha')}>
              <Text style={styles.emptyBtnText}>{filter === 'skin' ? '코인샵 가기' : '카드 뽑기'}</Text>
            </Pressable>
          </View>
        }
      />

      {selectedCard && (
        <CardDetailModal
          item={selectedCard}
          equippedFrameId={equippedFrameId}
          onClose={() => setSelectedCard(null)}
          onEquipChanged={id => setEquippedFrameId(id)}
        />
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
  backIcon: { fontFamily: F.r, color: '#fff', fontSize: 28, lineHeight: 32, marginTop: -2 },
  title: { fontFamily: F.eb, fontSize: 18, color: '#FFF', letterSpacing: 1 },
  countBadge: { fontFamily: F.sb, color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  tabTrack: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tabsContainer: { paddingHorizontal: 20, gap: 0 },
  tab: {
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1,
  },
  tabActive: { borderBottomColor: '#FFD700' },
  tabText: { fontFamily: F.r, color: 'rgba(255,255,255,0.40)', fontSize: 14 },
  tabTextActive: { fontFamily: F.b, color: '#FFF' },
  progressWrap: {
    marginHorizontal: 20, marginBottom: 8, gap: 6,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: F.sb, color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  progressCount: { fontFamily: F.b, color: 'rgba(255,255,255,0.60)', fontSize: 11 },
  shareBtn: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  shareBtnText: { fontFamily: F.b, color: 'rgba(255,255,255,0.50)', fontSize: 11 },
  progressTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#FFD700',
  },
  elemTabsContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 8 },
  elemTab: {
    height: 34,
    paddingHorizontal: 14, borderRadius: 17,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  elemTabText: {
    fontFamily: F.r, color: 'rgba(255,255,255,0.40)', fontSize: 12,
    lineHeight: 34, textAlign: 'center', includeFontPadding: false,
  },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, paddingHorizontal: 32, gap: 12,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontFamily: F.eb, color: 'rgba(255,255,255,0.72)', fontSize: 16, textAlign: 'center' },
  emptySub: { fontFamily: F.r, color: 'rgba(255,255,255,0.30)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: 'rgba(255,220,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.35)',
    borderRadius: 14,
  },
  emptyBtnText: { fontFamily: F.b, color: '#FFE500', fontSize: 14 },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  container: {
    alignItems: 'center', gap: 16,
    paddingHorizontal: 20,
  },
  card: {
    width: 220, height: 312, borderRadius: 14, overflow: 'hidden',
    borderWidth: 2,
  },
  descBox: {
    width: 280, backgroundColor: 'rgba(4,3,16,0.88)',
    borderRadius: 14, padding: 18,
    borderWidth: 1, gap: 8,
  },
  mythBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mythBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  mythBadgeText: { fontFamily: F.sb, fontSize: 10, letterSpacing: 0.8 },
  elemLabel: { fontFamily: F.r, color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  desc: { fontFamily: F.r, color: 'rgba(255,255,255,0.90)', fontSize: 14, lineHeight: 23, textAlign: 'center' },
  pullDate: { fontFamily: F.r, color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', marginTop: 4 },
  buffBox: {
    width: 280, borderRadius: 12, borderWidth: 1, padding: 12,
  },
  equipBtn: {
    width: 280, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center',
  },
  equipBtnText: { fontFamily: F.b, fontSize: 14 },
  closeBtn: {
    width: 160, paddingVertical: 13, borderRadius: 14,
    borderWidth: 1.5, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeBtnText: { fontFamily: F.b, fontSize: 15 },
});
