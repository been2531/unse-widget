export interface FrameStyle {
  borderColor: string;
  borderWidth: number;
  glowColor: string;
  glowRadius: number;
  label: string;
}

const FRAMES: Record<string, FrameStyle> = {
  // ── 가챠 전용 ────────────────────────────────────────────────────────────────
  frame_ancient: {
    borderColor: '#8B6914',
    borderWidth: 2.5,
    glowColor: '#A07820CC',
    glowRadius: 18,
    label: '고대 문양',
  },
  frame_silver: {
    borderColor: '#C0C8D8',
    borderWidth: 2.5,
    glowColor: '#90A8CCBB',
    glowRadius: 20,
    label: '은빛',
  },
  frame_gold: {
    borderColor: '#FFD700',
    borderWidth: 3,
    glowColor: '#FFB700CC',
    glowRadius: 24,
    label: '황금',
  },
  frame_dragon: {
    borderColor: '#44AAFF',
    borderWidth: 3,
    glowColor: '#2288FFCC',
    glowRadius: 28,
    label: '용왕',
  },

  // ── 코인샵 전용 ──────────────────────────────────────────────────────────────
  shop_dokkaebi: {
    borderColor: '#FF3300',
    borderWidth: 3,
    glowColor: '#FF1100CC',
    glowRadius: 22,
    label: '도깨비',
  },
  shop_phoenix: {
    borderColor: '#FF7700',
    borderWidth: 3,
    glowColor: '#FF5500CC',
    glowRadius: 24,
    label: '봉황',
  },
  shop_gumiho: {
    borderColor: '#DD66FF',
    borderWidth: 3,
    glowColor: '#BB33FFCC',
    glowRadius: 26,
    label: '구미호',
  },
  shop_samjogo: {
    borderColor: '#FFB700',
    borderWidth: 3.5,
    glowColor: '#FF9500CC',
    glowRadius: 30,
    label: '삼족오',
  },
};

export function getFrameStyle(frameId: string | null): FrameStyle | null {
  if (!frameId) return null;
  return FRAMES[frameId] ?? null;
}
