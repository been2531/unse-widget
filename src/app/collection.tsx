import {
  BlurMask, Canvas, Circle, LinearGradient, Rect, RoundedRect, vec,
} from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList, Image, Modal, Pressable, ScrollView,
  StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';

import { cardImageFor } from '@/gacha/cardAssets';
import {
  CARD_POOL, CATEGORY_LABEL, RARITY_COLOR, RARITY_LABEL,
  type CardCategory, type CardDef, type PulledCard,
} from '@/gacha/types';
import { getCollection } from '@/storage/collection';

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
const RARITY_ORDER: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };

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

const ALL_CHARS = CARD_POOL.filter(c => c.category === 'character');
const ALL_SKINS = CARD_POOL.filter(c => c.category === 'skin');

// ─── 카드 상세 모달 ────────────────────────────────────────────────────────────
type ModalItem = (CardDef & { owned: boolean }) | PulledCard;

function CardDetailModal({ item, onClose }: { item: ModalItem; onClose: () => void }) {
  const elemColor = ELEM_COLOR[item.element] ?? '#888';
  const [bgTop, bgBot] = ELEM_BG[item.element] ?? ['#12103a', '#0c1e3e'];
  const img = (item.category === 'character' || item.category === 'skin')
    ? cardImageFor(item.element, item.rarity)
    : null;
  const owned = 'owned' in item ? item.owned : true;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.container} onPress={e => e.stopPropagation()}>
          {/* 카드 */}
          <View style={[modalStyles.card, { borderColor: `${elemColor}88` }]}>
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              <Rect x={0} y={0} width={220} height={312}>
                <LinearGradient start={vec(0, 0)} end={vec(220, 312)} colors={[bgTop, bgBot]} />
              </Rect>
              <Circle cx={110} cy={125} r={70} color={`${elemColor}25`}>
                <BlurMask blur={20} style="normal" />
              </Circle>
              <RoundedRect x={0} y={0} width={220} height={312} r={14}
                color={`${elemColor}99`} style="stroke" strokeWidth={2} />
            </Canvas>

            <View style={{ position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center', height: 180, justifyContent: 'center' }}>
              {img
                ? <Image source={img} style={{ width: 160, height: 170 }} resizeMode="contain" />
                : <Text style={{ fontSize: 72 }}>{cardEmoji(item)}</Text>
              }
            </View>

            <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center', gap: 4 }}>
              <Text style={{ color: elemColor, fontSize: 16, fontWeight: '800' }}>
                {ELEM_LABEL[item.element]} {item.nameKo}
              </Text>
              <Text style={{ color: '#888', fontSize: 11, letterSpacing: 0.5 }}>{item.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Text style={{ color: RARITY_COLOR[item.rarity], fontSize: 11, fontWeight: '700' }}>
                  {RARITY_LABEL[item.rarity]}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                  {CATEGORY_LABEL[item.category]}
                </Text>
              </View>
              {!owned && (
                <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>미수집</Text>
              )}
            </View>
          </View>

          {/* 설명 */}
          <View style={modalStyles.descBox}>
            <Text style={modalStyles.desc}>{item.description}</Text>
          </View>

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
  const [collected, setCollected] = useState<PulledCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ModalItem | null>(null);

  useEffect(() => {
    getCollection().then(setCollected);
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

  const COLS = 3;
  const CARD_W = (screenW - 48) / COLS;
  const CARD_H = CARD_W * 1.42;

  type Item = (typeof characterItems)[number] | PulledCard;

  function renderCard({ item }: { item: Item }) {
    const owned = 'owned' in item ? item.owned : true;
    const elemColor = ELEM_COLOR[item.element] ?? '#888';
    const img = (item.category === 'character' || item.category === 'skin')
      ? cardImageFor(item.element, item.rarity)
      : null;

    return (
      <Pressable
        style={{ width: CARD_W, height: CARD_H, padding: 4 }}
        onPress={() => setSelectedCard(item)}
      >
        <View style={{
          flex: 1, borderRadius: 10, overflow: 'hidden',
          opacity: owned ? 1 : 0.28,
          borderWidth: owned ? 1.5 : 1,
          borderColor: owned ? `${elemColor}88` : 'rgba(255,255,255,0.12)',
        }}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Rect x={0} y={0} width={CARD_W - 8} height={CARD_H - 8}>
              <LinearGradient start={vec(0, 0)} end={vec(CARD_W, CARD_H)} colors={['#0E0B22', '#080B1A']} />
            </Rect>
            {owned && (
              <Circle cx={(CARD_W - 8) / 2} cy={(CARD_H - 8) * 0.4} r={(CARD_W - 8) * 0.22}
                color={`${elemColor}20`}>
                <BlurMask blur={12} style="normal" />
              </Circle>
            )}
          </Canvas>

          <View style={{ position: 'absolute', top: 4, left: 4, right: 4, height: (CARD_H - 8) * 0.58, alignItems: 'center', justifyContent: 'center' }}>
            {img
              ? <Image source={img} style={{ width: CARD_W - 20, height: (CARD_H - 8) * 0.55 }} resizeMode="contain" />
              : <Text style={{ fontSize: CARD_W * 0.28 }}>{cardEmoji(item)}</Text>
            }
          </View>

          <View style={{ position: 'absolute', bottom: 6, left: 0, right: 0, alignItems: 'center', gap: 2 }}>
            <Text style={{ color: elemColor, fontSize: 9, fontWeight: '700', textAlign: 'center', paddingHorizontal: 4 }} numberOfLines={1}>
              {ELEM_LABEL[item.element]} {item.nameKo}
            </Text>
            <Text style={{ color: RARITY_COLOR[item.rarity], fontSize: 8, fontWeight: '600' }}>
              {RARITY_LABEL[item.rarity]}
            </Text>
            {!owned && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7 }}>미수집</Text>}
          </View>
        </View>
      </Pressable>
    );
  }

  const data: Item[] = filter === 'character' ? characterItems
    : filter === 'fortune' ? fortuneItems
    : filter === 'skin' ? skinItems
    : allItems;

  const ownedCount = filter === 'character' ? characterItems.filter(c => c.owned).length
    : filter === 'skin' ? skinItems.filter(c => c.owned).length
    : data.length;
  const totalCount = filter === 'character' ? ALL_CHARS.length
    : filter === 'skin' ? ALL_SKINS.length
    : null;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'character', label: '캐릭터' },
    { key: 'fortune',   label: '운세 카드' },
    { key: 'skin',      label: '스킨' },
    { key: 'all',       label: '전체' },
  ];

  return (
    <View style={styles.screen}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={screenW} height={9999}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 400)} colors={['#0E0B22', '#080B18']} />
        </Rect>
      </Canvas>

      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          {/* 쉐브론 아이콘 — View 기반 크로스플랫폼 */}
          <View style={styles.chevron} />
        </Pressable>
        <Text style={styles.title}>내 컬렉션</Text>
        <Text style={styles.countBadge}>
          {totalCount !== null ? `${ownedCount}/${totalCount}` : `${ownedCount}장`}
        </Text>
      </View>

      {/* 필터 탭 — 스크롤 가능 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer} style={{ flexGrow: 0 }}>
        {FILTERS.map(({ key, label }) => (
          <Pressable key={key}
            style={[styles.tab, filter === key && styles.tabActive]}
            onPress={() => setFilter(key)}>
            <Text style={[styles.tabText, filter === key && styles.tabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={item => ('owned' in item ? item.id + '_' + item.uid : item.uid)}
        renderItem={renderCard}
        numColumns={COLS}
        key={filter}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      />

      {selectedCard && (
        <CardDetailModal item={selectedCard} onClose={() => setSelectedCard(null)} />
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
  title: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  countBadge: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '600' },
  tabsContainer: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tab: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.30)',
  },
  tabText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
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
    width: 260, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  desc: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  closeBtn: {
    width: 160, paddingVertical: 13, borderRadius: 14,
    borderWidth: 1.5, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeBtnText: { fontSize: 15, fontWeight: '700' },
});
