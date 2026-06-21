export interface FrameStyle {
  borderColor: string;
  borderWidth: number;
  glowColor: string;
  glowRadius: number;
  label: string;
}

const FRAMES: Record<string, FrameStyle> = {
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
};

export function getFrameStyle(frameId: string | null): FrameStyle | null {
  if (!frameId) return null;
  return FRAMES[frameId] ?? null;
}
