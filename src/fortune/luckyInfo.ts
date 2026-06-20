import { fnv1aHash } from './hash';
import type { DiiSign, StarSign } from './types';

const COLORS = [
  { name: '빨강', hex: '#FF4444' }, { name: '주황', hex: '#FF8C00' },
  { name: '노랑', hex: '#FFD700' }, { name: '초록', hex: '#44CC77' },
  { name: '파랑', hex: '#4488FF' }, { name: '남색', hex: '#3344CC' },
  { name: '보라', hex: '#9944FF' }, { name: '흰색', hex: '#F0F0F0' },
  { name: '검정', hex: '#444444' }, { name: '금색', hex: '#FFB800' },
  { name: '은색', hex: '#C0C0C0' }, { name: '분홍', hex: '#FF88BB' },
];

const DIRECTIONS = ['동', '서', '남', '북', '동남', '동북', '서남', '서북'];
const HOURS = ['자시(23-1시)', '축시(1-3시)', '인시(3-5시)', '묘시(5-7시)',
               '진시(7-9시)', '사시(9-11시)', '오시(11-13시)', '미시(13-15시)',
               '신시(15-17시)', '유시(17-19시)', '술시(19-21시)', '해시(21-23시)'];

export interface LuckyInfo {
  color: { name: string; hex: string };
  number: number;
  direction: string;
  hour: string;
}

export function deriveLuckyInfo(date: string, diiSign: DiiSign, starSign: StarSign): LuckyInfo {
  const base = `${date}:${diiSign}:${starSign}`;
  const color     = COLORS[fnv1aHash(`${base}:color`) % COLORS.length];
  const number    = (fnv1aHash(`${base}:number`) % 9) + 1;
  const direction = DIRECTIONS[fnv1aHash(`${base}:dir`) % DIRECTIONS.length];
  const hour      = HOURS[fnv1aHash(`${base}:hour`) % HOURS.length];
  return { color, number, direction, hour };
}
