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
  // ── 봉황 (불) ──────────────────────────────────────────────────────────────
  {
    id: 'fire_1', name: 'Bong-a', nameKo: '봉아',
    category: 'character', rarity: 'common', element: 'fire',
    description: '불꽃 속에서 알을 깨고 나온 아기 봉황. 날갯짓마다 작은 불꽃이 흩날리고, 재채기를 하면 불씨가 핀다.',
  },
  {
    id: 'fire_2', name: 'Bonghwang', nameKo: '봉황',
    category: 'character', rarity: 'rare', element: 'fire',
    description: '오색 불꽃으로 하늘을 물들이는 봉황. 천 년에 한 번 알에서 태어나 죽고 다시 태어나며 불멸을 산다.',
  },
  {
    id: 'fire_3', name: 'Samjogo', nameKo: '삼족오',
    category: 'character', rarity: 'legendary', element: 'fire',
    description: '태양 속에 산다는 세 발 달린 까마귀. 날갯짓으로 여명을 깨우고 석양을 연다. 고구려 벽화에 그 모습이 남아 있다.',
  },
  {
    id: 'fire_4', name: 'Taeyangsinjo', nameKo: '태양신조',
    category: 'character', rarity: 'mythic', element: 'fire',
    description: '하늘의 불을 수호하는 신조(神鳥). 깃털 하나가 떨어지면 세상에 빛이 가득 차고, 울음소리가 울리면 암흑이 물러간다.',
  },

  // ── 이무기·용 (물) ─────────────────────────────────────────────────────────
  {
    id: 'water_1', name: 'Imugi', nameKo: '이무기',
    category: 'character', rarity: 'common', element: 'water',
    description: '용이 되길 꿈꾸는 어린 이무기. 폭포 아래에서 천 년을 수련하며 여의주를 기다린다.',
  },
  {
    id: 'water_2', name: 'Yongnyeo', nameKo: '용녀',
    category: 'character', rarity: 'rare', element: 'water',
    description: '동해 바다를 수호하는 용왕의 딸 용녀. 그녀의 눈물은 진주가 되고, 웃음은 파도를 잠재운다.',
  },
  {
    id: 'water_3', name: 'Yongwang', nameKo: '용왕',
    category: 'character', rarity: 'legendary', element: 'water',
    description: '사해를 다스리는 해룡왕. 노하면 폭풍이 일고 웃으면 바다가 잔잔해진다. 수궁에서 뭇 생령을 다스린다.',
  },
  {
    id: 'water_4', name: 'Habaek', nameKo: '하백',
    category: 'character', rarity: 'mythic', element: 'water',
    description: '강과 물의 신 하백. 주몽의 외조부이며 유화를 딸로 두었다. 물결을 일으켜 세상의 흐름을 바꾼다.',
  },

  // ── 뇌신 (번개) ────────────────────────────────────────────────────────────
  {
    id: 'lightning_1', name: 'Chunbung', nameKo: '천붕이',
    category: 'character', rarity: 'common', element: 'lightning',
    description: '천둥 소리에 깜짝 놀라 재채기하는 개구쟁이 아기 뇌신. 먹구름을 타고 놀다 벼락을 떨어뜨리기도 한다.',
  },
  {
    id: 'lightning_2', name: 'Noegong', nameKo: '뇌공',
    category: 'character', rarity: 'rare', element: 'lightning',
    description: '하늘의 북을 두드려 천둥을 일으키는 뇌공. 번개를 화살처럼 날리고, 먹구름을 구름마차처럼 탄다.',
  },
  {
    id: 'lightning_3', name: 'Noesin', nameKo: '뇌신',
    category: 'character', rarity: 'legendary', element: 'lightning',
    description: '천상의 번개를 관장하는 뇌신. 손길이 닿은 곳마다 벼락이 내리치고, 그의 분노는 폭풍우로 세상을 뒤흔든다.',
  },
  {
    id: 'lightning_4', name: 'Okhwang', nameKo: '옥황',
    category: 'character', rarity: 'mythic', element: 'lightning',
    description: '하늘 위 모든 신들을 통솔하는 옥황상제. 뇌신·풍신·우신을 거느리고 천지의 질서를 주관한다.',
  },

  // ── 산신 (자연) ────────────────────────────────────────────────────────────
  {
    id: 'nature_1', name: 'Sansini', nameKo: '산신이',
    category: 'character', rarity: 'common', element: 'nature',
    description: '깊은 산속에 사는 아기 산신령. 호랑이를 친구 삼아 뛰어놀고, 발걸음마다 새싹이 돋아난다.',
  },
  {
    id: 'nature_2', name: 'Jisin', nameKo: '지신',
    category: 'character', rarity: 'rare', element: 'nature',
    description: '대지의 기운을 다스리는 지신. 발을 구르면 땅이 울리고, 손을 얹으면 씨앗이 꽃을 피운다.',
  },
  {
    id: 'nature_3', name: 'Sansin', nameKo: '산신',
    category: 'character', rarity: 'epic', element: 'nature',
    description: '백두대간을 관장하는 산신. 흰 수염의 노인 모습으로 호랑이와 함께 나타나며, 산의 모든 생명을 수호한다.',
  },
  {
    id: 'nature_4', name: 'Dangun', nameKo: '단군',
    category: 'character', rarity: 'mythic', element: 'nature',
    description: '하늘의 아들 환웅과 웅녀 사이에서 태어난 신인. 아사달에 도읍을 정해 조선을 세우고 1,500년을 다스렸다.',
  },

  // ── 도깨비 (암흑) ──────────────────────────────────────────────────────────
  {
    id: 'dark_1', name: 'Dokkaebi', nameKo: '도깨비',
    category: 'character', rarity: 'common', element: 'dark',
    description: '인간 세상이 궁금해 집 처마에 숨어 사는 아기 도깨비. 씨름을 좋아하고, 개가 오면 도망간다.',
  },
  {
    id: 'dark_2', name: 'Jeoseungsaja', nameKo: '저승사자',
    category: 'character', rarity: 'rare', element: 'dark',
    description: '망자를 저승으로 안내하는 저승사자. 무표정하지만 길 잃은 혼은 절대 버리지 않는다.',
  },
  {
    id: 'dark_3', name: 'Yeomra', nameKo: '염라대왕',
    category: 'character', rarity: 'epic', element: 'dark',
    description: '지옥을 다스리는 염라대왕. 선한 자에게는 관대하고 악한 자에게는 엄격하다. 모든 죽은 자의 업보를 심판한다.',
  },
  {
    id: 'dark_4', name: 'Myeongwang', nameKo: '명부왕',
    category: 'character', rarity: 'mythic', element: 'dark',
    description: '삶과 죽음의 경계를 관장하는 신. 운명의 책을 쥐고 시간과 생사를 주관하며 이승과 저승 사이를 오간다.',
  },

  // ── 선녀 (빛) ──────────────────────────────────────────────────────────────
  {
    id: 'light_1', name: 'Seonnyeo', nameKo: '선녀',
    category: 'character', rarity: 'common', element: 'light',
    description: '하늘나라에서 내려온 아기 선녀. 날개옷이 바람에 날릴 때마다 꽃비가 내리고, 웃음소리가 종소리처럼 울린다.',
  },
  {
    id: 'light_2', name: 'Dalnim', nameKo: '달님',
    category: 'character', rarity: 'rare', element: 'light',
    description: '달을 지키는 달신. 보름이면 환하게 빛나고, 그믐이면 별빛 사이에 숨어 조용히 세상을 내려다본다.',
  },
  {
    id: 'light_3', name: 'Haemosu', nameKo: '해모수',
    category: 'character', rarity: 'legendary', element: 'light',
    description: '태양 마차를 타고 내려온 천제의 아들 해모수. 주몽의 아버지이며, 오룡거를 타고 오우를 부린다.',
  },
  {
    id: 'light_4', name: 'Hwanim', nameKo: '환인',
    category: 'character', rarity: 'mythic', element: 'light',
    description: '하늘의 최고신 환인. 아들 환웅에게 천부인 세 개를 주어 땅으로 내려 보내 인간 세상을 다스리게 했다.',
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
