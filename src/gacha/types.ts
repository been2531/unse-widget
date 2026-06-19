export type ElementType = 'fire' | 'water' | 'lightning' | 'nature' | 'dark' | 'light';
export type Rarity      = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type CardCategory = 'character' | 'skin' | 'fortune';

export interface CardDef {
  id: string;
  name: string;
  nameKo: string;
  category: CardCategory;
  rarity: Rarity;
  element: ElementType;
  description: string;
}

export interface PulledCard extends CardDef {
  uid: string;     // 인스턴스 고유 ID
  pulledAt: string; // ISO
}

// ─── 카드 풀 ────────────────────────────────────────────────────────────────
//
// 원소별 3단계: 어린(Common) → 청년(Rare) → 성인(Epic/Legendary)
// 알 없음. 각 캐릭터는 독립 IP.

export const CARD_POOL: CardDef[] = [
  // ── 화염 ──────────────────────────────────────────────────────────────────
  {
    id: 'fire_1', name: 'Hwai', nameKo: '화이',
    category: 'character', rarity: 'common', element: 'fire',
    description: '세상 모든 것에 호기심 가득한 어린 화염 드래곤. 재채기할 때마다 불꽃이 튄다.',
  },
  {
    id: 'fire_2', name: 'Bulsae', nameKo: '불새',
    category: 'character', rarity: 'rare', element: 'fire',
    description: '활화산을 단숨에 넘는 청년 화염 드래곤. 두려움이 없다.',
  },
  {
    id: 'fire_3', name: 'Yeomwang', nameKo: '염왕',
    category: 'character', rarity: 'legendary', element: 'fire',
    description: '화염의 왕. 날갯짓 한 번으로 도시를 밝힌다.',
  },

  // ── 수계 ──────────────────────────────────────────────────────────────────
  {
    id: 'water_1', name: 'Muri', nameKo: '물이',
    category: 'character', rarity: 'common', element: 'water',
    description: '웅덩이만 보면 뛰어드는 장난꾸러기 어린 물 드래곤.',
  },
  {
    id: 'water_2', name: 'Param', nameKo: '파람',
    category: 'character', rarity: 'rare', element: 'water',
    description: '파도를 자유자재로 다루는 청년 물 드래곤. 울면 소나기가 내린다.',
  },
  {
    id: 'water_3', name: 'Haewang', nameKo: '해왕',
    category: 'character', rarity: 'legendary', element: 'water',
    description: '바다의 지배자. 잠들면 폭풍이 멎고, 깨어나면 해일이 인다.',
  },

  // ── 번개 ──────────────────────────────────────────────────────────────────
  {
    id: 'lightning_1', name: 'Beoni', nameKo: '번이',
    category: 'character', rarity: 'common', element: 'lightning',
    description: '이것저것 건드리다 매일 감전되는 어린 번개 드래곤.',
  },
  {
    id: 'lightning_2', name: 'Jeoni', nameKo: '전이',
    category: 'character', rarity: 'rare', element: 'lightning',
    description: '번개보다 빠른 반사 신경. 청년 번개 드래곤.',
  },
  {
    id: 'lightning_3', name: 'Cheonwang', nameKo: '천왕',
    category: 'character', rarity: 'legendary', element: 'lightning',
    description: '하늘의 지배자. 날개를 펼칠 때마다 천둥이 울린다.',
  },

  // ── 자연 ──────────────────────────────────────────────────────────────────
  {
    id: 'nature_1', name: 'Sori', nameKo: '솔이',
    category: 'character', rarity: 'common', element: 'nature',
    description: '식물과 대화하는 어린 자연 드래곤. 발걸음마다 새싹이 난다.',
  },
  {
    id: 'nature_2', name: 'Puri', nameKo: '풀이',
    category: 'character', rarity: 'rare', element: 'nature',
    description: '고목과 덩굴을 다루는 청년 자연 드래곤.',
  },
  {
    id: 'nature_3', name: 'Jawang', nameKo: '자왕',
    category: 'character', rarity: 'epic', element: 'nature',
    description: '자연의 수호자. 숨결 하나로 황무지를 숲으로 바꾼다.',
  },

  // ── 암흑 ──────────────────────────────────────────────────────────────────
  {
    id: 'dark_1', name: 'Bami', nameKo: '밤이',
    category: 'character', rarity: 'common', element: 'dark',
    description: '낮보다 밤이 좋은 어린 암흑 드래곤. 꿈속에서 내일을 본다.',
  },
  {
    id: 'dark_2', name: 'Heuki', nameKo: '흑이',
    category: 'character', rarity: 'rare', element: 'dark',
    description: '어둠을 옷처럼 두르는 청년 암흑 드래곤.',
  },
  {
    id: 'dark_3', name: 'Eowang', nameKo: '어왕',
    category: 'character', rarity: 'epic', element: 'dark',
    description: '어둠과 별의 군주. 그가 나타나면 낮도 밤이 된다.',
  },

  // ── 빛 ────────────────────────────────────────────────────────────────────
  {
    id: 'light_1', name: 'Bici', nameKo: '빛이',
    category: 'character', rarity: 'common', element: 'light',
    description: '어두운 곳에서도 은은하게 빛나는 어린 빛 드래곤.',
  },
  {
    id: 'light_2', name: 'Haetnim', nameKo: '햇님',
    category: 'character', rarity: 'rare', element: 'light',
    description: '태양을 닮아가는 청년 빛 드래곤. 웃으면 주변이 환해진다.',
  },
  {
    id: 'light_3', name: 'Gwangwang', nameKo: '광왕',
    category: 'character', rarity: 'legendary', element: 'light',
    description: '빛의 왕. 그가 존재하는 것만으로 세상의 어둠이 걷힌다.',
  },

  // ── 신화 등급 드래곤 (각 원소 최고 단계) ──────────────────────────────────
  {
    id: 'fire_4', name: 'Cheonhwa', nameKo: '천화신',
    category: 'character', rarity: 'mythic', element: 'fire',
    description: '우주의 불꽃을 다스리는 신. 탄생할 때 은하계 하나가 불타올랐다 전해진다.',
  },
  {
    id: 'water_4', name: 'Yongwang', nameKo: '용왕',
    category: 'character', rarity: 'mythic', element: 'water',
    description: '모든 바다의 지배자이자 시간의 흐름을 조율하는 신. 그의 눈물이 첫 번째 대양이 되었다.',
  },
  {
    id: 'lightning_4', name: 'Noesin', nameKo: '뇌신',
    category: 'character', rarity: 'mythic', element: 'lightning',
    description: '천둥의 근원. 우주가 태어날 때 가장 먼저 울린 번개의 화신이다.',
  },
  {
    id: 'nature_4', name: 'Moksin', nameKo: '목신',
    category: 'character', rarity: 'mythic', element: 'nature',
    description: '세계수 뿌리에 잠든 생명의 신. 한 번 눈을 뜨면 새로운 생명이 탄생한다.',
  },
  {
    id: 'dark_4', name: 'Myeongbu', nameKo: '명부왕',
    category: 'character', rarity: 'mythic', element: 'dark',
    description: '이승과 저승의 경계를 관장하는 신. 그 앞에서는 시간도 멈춘다.',
  },
  {
    id: 'light_4', name: 'Taeyangsin', nameKo: '태양신',
    category: 'character', rarity: 'mythic', element: 'light',
    description: '모든 빛의 근원. 우주 탄생의 순간 생겨난 첫 번째 신성이다.',
  },

  // ── 한국 신화 — 구미호 (fire) ─────────────────────────────────────────────
  {
    id: 'gumiho_1', name: 'Miho', nameKo: '미호',
    category: 'character', rarity: 'common', element: 'fire',
    description: '꼬리가 하나뿐인 어린 구미호. 반짝이는 눈으로 세상 모든 것을 흉내 낸다.',
  },
  {
    id: 'gumiho_2', name: 'Yeowoo', nameKo: '여우',
    category: 'character', rarity: 'rare', element: 'fire',
    description: '꼬리가 셋으로 늘어난 구미호. 사람의 말을 배우기 시작했다.',
  },
  {
    id: 'gumiho_3', name: 'Gumiho', nameKo: '구미호',
    category: 'character', rarity: 'legendary', element: 'fire',
    description: '아홉 꼬리를 지닌 전설의 구미호. 그 눈빛만으로 운명을 바꾼다 전해진다.',
  },

  // ── 한국 신화 — 이무기 (water) ────────────────────────────────────────────
  {
    id: 'imugi_1', name: 'Imi', nameKo: '이미',
    category: 'character', rarity: 'common', element: 'water',
    description: '강 바닥에서 잠을 자는 어린 이무기. 비 오는 날이면 수면 위로 얼굴을 내민다.',
  },
  {
    id: 'imugi_2', name: 'Suri', nameKo: '수리',
    category: 'character', rarity: 'rare', element: 'water',
    description: '깊은 연못을 지배하기 시작한 이무기. 폭풍이 오면 몸을 크게 뻗는다.',
  },
  {
    id: 'imugi_3', name: 'Imugi', nameKo: '이무기',
    category: 'character', rarity: 'epic', element: 'water',
    description: '용이 되기 직전의 이무기. 하늘로 올라갈 날을 천 년간 기다렸다.',
  },

  // ── 한국 신화 — 삼족오 (lightning) ───────────────────────────────────────
  {
    id: 'samjogo_1', name: 'Sammi', nameKo: '삼미',
    category: 'character', rarity: 'common', element: 'lightning',
    description: '발이 세 개인 어린 삼족오. 태양 근처를 날아다니다 깃털을 그을린다.',
  },
  {
    id: 'samjogo_2', name: 'Haejo', nameKo: '해조',
    category: 'character', rarity: 'rare', element: 'lightning',
    description: '태양 안을 자유롭게 드나드는 삼족오. 날갯짓마다 번개가 따라온다.',
  },
  {
    id: 'samjogo_3', name: 'Samjogo', nameKo: '삼족오',
    category: 'character', rarity: 'legendary', element: 'lightning',
    description: '하늘의 전령, 세 발 달린 태양의 새. 그 비행은 번개보다 빠르다.',
  },

  // ── 한국 신화 — 봉황 (nature) ─────────────────────────────────────────────
  {
    id: 'bonghwang_1', name: 'Bong', nameKo: '봉이',
    category: 'character', rarity: 'common', element: 'nature',
    description: '작고 화려한 어린 봉황. 날 때마다 꽃향기를 뿌린다.',
  },
  {
    id: 'bonghwang_2', name: 'Hwang', nameKo: '황이',
    category: 'character', rarity: 'rare', element: 'nature',
    description: '오색 깃털이 완성된 봉황. 노랫소리로 시든 꽃을 되살린다.',
  },
  {
    id: 'bonghwang_3', name: 'Bonghwang', nameKo: '봉황',
    category: 'character', rarity: 'epic', element: 'nature',
    description: '성군이 나타날 때 모습을 드러내는 전설의 새. 그 존재 자체가 길조다.',
  },

  // ── 한국 신화 — 도깨비 (dark) ─────────────────────────────────────────────
  {
    id: 'dokkaebi_1', name: 'Dokki', nameKo: '도끼',
    category: 'character', rarity: 'common', element: 'dark',
    description: '방망이를 갖고 싶어 안달이 난 어린 도깨비. 장난치다 스스로 놀란다.',
  },
  {
    id: 'dokkaebi_2', name: 'Gwisin', nameKo: '귀신이',
    category: 'character', rarity: 'rare', element: 'dark',
    description: '도깨비불을 자유자재로 다루는 중년 도깨비. 씨름을 즐긴다.',
  },
  {
    id: 'dokkaebi_3', name: 'Dokkaebi', nameKo: '도깨비',
    category: 'character', rarity: 'epic', element: 'dark',
    description: '인간과 신 사이를 오가는 늙은 도깨비. 금은보화를 만드는 방망이를 가졌다.',
  },

  // ── 한국 신화 — 해태 (light) ──────────────────────────────────────────────
  {
    id: 'haetae_1', name: 'Hae', nameKo: '해이',
    category: 'character', rarity: 'common', element: 'light',
    description: '뿔이 막 돋아난 어린 해태. 불의를 보면 작은 몸으로 으르렁댄다.',
  },
  {
    id: 'haetae_2', name: 'Taetae', nameKo: '태태',
    category: 'character', rarity: 'rare', element: 'light',
    description: '화재를 막는 해태. 연기 냄새를 맡으면 어디서든 달려온다.',
  },
  {
    id: 'haetae_3', name: 'Haetae', nameKo: '해태',
    category: 'character', rarity: 'legendary', element: 'light',
    description: '정의의 수호자. 옳고 그름을 뿔로 판단하며, 거짓 앞에서는 절대 굽히지 않는다.',
  },

  // ── 한국 신화 — 사신 (四神) ───────────────────────────────────────────────
  // 청룡 (Azure Dragon) — nature
  {
    id: 'cheongnyong_1', name: 'Cheong', nameKo: '청이',
    category: 'character', rarity: 'common', element: 'nature',
    description: '동쪽 하늘을 지키는 어린 청룡. 비늘마다 새싹이 돋아 있다.',
  },
  {
    id: 'cheongnyong_2', name: 'Nyon', nameKo: '녕이',
    category: 'character', rarity: 'rare', element: 'nature',
    description: '봄비를 부르는 청룡. 구름 속에서 용트림하면 대지가 초록으로 물든다.',
  },
  {
    id: 'cheongnyong_3', name: 'Cheongnyong', nameKo: '청룡',
    category: 'character', rarity: 'legendary', element: 'nature',
    description: '동방의 수호신, 청룡. 그의 출현은 대풍년과 태평성대를 예고한다.',
  },
  // 백호 (White Tiger) — light
  {
    id: 'baekho_1', name: 'Baek', nameKo: '백이',
    category: 'character', rarity: 'common', element: 'light',
    description: '서쪽 하늘을 지키는 어린 백호. 흰 털에서 은빛이 반짝인다.',
  },
  {
    id: 'baekho_2', name: 'Ho', nameKo: '호이',
    category: 'character', rarity: 'rare', element: 'light',
    description: '달빛을 모아 달리는 백호. 포효 한 번으로 어둠이 흩어진다.',
  },
  {
    id: 'baekho_3', name: 'Baekho', nameKo: '백호',
    category: 'character', rarity: 'epic', element: 'light',
    description: '서방의 수호신, 백호. 정의와 전쟁의 화신. 눈빛만으로 적의 기를 꺾는다.',
  },
  // 주작 (Vermilion Bird) — fire
  {
    id: 'jujak_1', name: 'Ju', nameKo: '주이',
    category: 'character', rarity: 'common', element: 'fire',
    description: '남쪽 하늘을 지키는 어린 주작. 깃털이 불꽃처럼 타오른다.',
  },
  {
    id: 'jujak_2', name: 'Jak', nameKo: '작이',
    category: 'character', rarity: 'rare', element: 'fire',
    description: '여름 태양을 품은 주작. 날개를 펼치면 하늘이 붉게 물든다.',
  },
  {
    id: 'jujak_3', name: 'Jujak', nameKo: '주작',
    category: 'character', rarity: 'legendary', element: 'fire',
    description: '남방의 수호신, 주작. 불사조의 조상. 죽어도 불꽃 속에서 다시 태어난다.',
  },
  // 현무 (Black Tortoise) — water
  {
    id: 'hyeonmu_1', name: 'Hyeon', nameKo: '현이',
    category: 'character', rarity: 'common', element: 'water',
    description: '북쪽 바다를 지키는 어린 현무. 거북 등에 뱀이 감겨 있다.',
  },
  {
    id: 'hyeonmu_2', name: 'Mu', nameKo: '무이',
    category: 'character', rarity: 'rare', element: 'water',
    description: '겨울 바다를 다스리는 현무. 등껍질로 어떤 파도도 막아낸다.',
  },
  {
    id: 'hyeonmu_3', name: 'Hyeonmu', nameKo: '현무',
    category: 'character', rarity: 'epic', element: 'water',
    description: '북방의 수호신, 현무. 오백 년을 살아온 불멸의 존재. 지혜와 인내의 화신.',
  },

  // ── 스킨 — 카드 프레임 ────────────────────────────────────────────────────
  {
    id: 'frame_ancient', name: 'Ancient Frame', nameKo: '고대 문양 프레임',
    category: 'skin', rarity: 'rare', element: 'nature',
    description: '한국 전통 문양으로 새겨진 프레임. 카드에 고풍스러운 분위기를 더한다.',
  },
  {
    id: 'frame_silver', name: 'Silver Frame', nameKo: '은빛 프레임',
    category: 'skin', rarity: 'rare', element: 'light',
    description: '달빛을 담은 은빛 프레임. 신비롭고 차가운 광채가 흐른다.',
  },
  {
    id: 'frame_gold', name: 'Gold Frame', nameKo: '황금 프레임',
    category: 'skin', rarity: 'epic', element: 'fire',
    description: '순금으로 도금된 프레임. 보는 것만으로 재운이 따른다고 전해진다.',
  },
  {
    id: 'frame_dragon', name: 'Dragon Frame', nameKo: '용왕 프레임',
    category: 'skin', rarity: 'legendary', element: 'water',
    description: '동해 용왕의 비늘로 만든 프레임. 전설급 카드에만 어울리는 격이다.',
  },

  // ── 운세 카드 (30%) ────────────────────────────────────────────────────────
  {
    id: 'fort_fire_com',   name: 'Hwai Ember',       nameKo: '화이의 불씨',
    category: 'fortune', rarity: 'common',    element: 'fire',
    description: '화이의 불씨가 재물운에 온기를 더한다.',
  },
  {
    id: 'fort_water_com',  name: 'Muri Wave',        nameKo: '물이의 잔물결',
    category: 'fortune', rarity: 'common',    element: 'water',
    description: '물이가 보내는 잔물결. 오늘 연애운이 흐른다.',
  },
  {
    id: 'fort_nature_rare',name: 'Jawang Blessing',  nameKo: '자왕의 축복',
    category: 'fortune', rarity: 'rare',      element: 'nature',
    description: '자왕이 대지의 기운을 나눈다. 건강운 상승.',
  },
  {
    id: 'fort_light_rare', name: 'Haetnim Smile',    nameKo: '햇님의 미소',
    category: 'fortune', rarity: 'rare',      element: 'light',
    description: '햇님이 웃는 날. 직장에서 기회가 열린다.',
  },
  {
    id: 'fort_dark_epic',  name: 'Eowang Prophecy',  nameKo: '어왕의 예언',
    category: 'fortune', rarity: 'epic',      element: 'dark',
    description: '어왕이 별에서 읽어낸 오늘의 운명. 모든 운세가 선명해진다.',
  },
  {
    id: 'fort_legend',     name: 'Gwangwang Light',  nameKo: '광왕의 빛',
    category: 'fortune', rarity: 'legendary', element: 'light',
    description: '광왕의 빛이 오늘을 전설로 만든다.',
  },
];

// ─── 확률 구조 ─────────────────────────────────────────────────────────────
export const CATEGORY_WEIGHTS: Record<CardCategory, number> = {
  character: 62, skin: 8, fortune: 30,
};
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 70, rare: 20, epic: 7, legendary: 2, mythic: 1,
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'COMMON', rare: 'RARE', epic: 'EPIC', legendary: 'LEGENDARY', mythic: 'MYTHIC',
};
export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#AAAAAA', rare: '#4FC3F7', epic: '#CC44FF', legendary: '#FF8800', mythic: '#FFD700',
};
export const CATEGORY_LABEL: Record<CardCategory, string> = {
  character: '캐릭터', skin: '스킨', fortune: '운세 카드',
};

export const PULL_COST      = 30;
export const MULTI_PULL_COST = 280;  // 10회, 7% 할인
export const DAILY_COINS    = 100;
