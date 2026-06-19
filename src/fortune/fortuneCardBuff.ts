export type BuffCategory = 'wealth' | 'love' | 'health' | 'work' | 'all';

export interface FortuneBuff {
  affectedCategory: BuffCategory;
  bonusText: string;
  color: string;
  emoji: string;
}

// 운세 카드 ID → 버프 정의
export const FORTUNE_CARD_BUFFS: Record<string, FortuneBuff> = {
  fort_fire_com: {
    affectedCategory: 'wealth',
    bonusText: '화이의 불씨가 재물운을 밝혀줍니다. 오늘 지출보다 수입에 집중하세요.',
    color: '#FF6600',
    emoji: '🔥',
  },
  fort_water_com: {
    affectedCategory: 'love',
    bonusText: '물이의 잔물결이 연애운을 부드럽게 흐르게 합니다. 솔직한 표현이 통합니다.',
    color: '#00AAFF',
    emoji: '💧',
  },
  fort_nature_rare: {
    affectedCategory: 'health',
    bonusText: '자왕의 축복이 건강운을 북돋습니다. 오늘은 몸의 신호에 귀 기울이세요.',
    color: '#44FF88',
    emoji: '🌿',
  },
  fort_light_rare: {
    affectedCategory: 'work',
    bonusText: '햇님의 미소가 직장운을 열어줍니다. 발언 기회를 놓치지 마세요.',
    color: '#FFD700',
    emoji: '✨',
  },
  fort_dark_epic: {
    affectedCategory: 'all',
    bonusText: '어왕의 예언이 오늘의 모든 운세를 선명하게 합니다. 결단력 있게 행동하세요.',
    color: '#CC44FF',
    emoji: '🌑',
  },
  fort_legend: {
    affectedCategory: 'all',
    bonusText: '광왕의 빛이 오늘 하루를 전설로 만듭니다. 어떤 선택도 빛날 것입니다.',
    color: '#FF8800',
    emoji: '👑',
  },
};

export function getActiveBuff(cardId: string): FortuneBuff | null {
  return FORTUNE_CARD_BUFFS[cardId] ?? null;
}
