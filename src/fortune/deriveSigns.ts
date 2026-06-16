import type { DiiSign, StarSign, UserSigns } from './types';

const DII_ORDER: DiiSign[] = [
  '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지',
];

// 1984 = Year of the Rat (쥐). Gregorian-year-only mapping — no lunar new year
// boundary adjustment for v1 (deliberate simplification, see plan).
export function deriveDiiSign(year: number): DiiSign {
  const index = ((year - 1984) % 12 + 12) % 12;
  return DII_ORDER[index];
}

// End-of-range (month, day) for each Western zodiac sign, in calendar order
// from Jan 1. 염소자리 appears twice because it wraps the year boundary
// (Dec 22 - Jan 19).
const STAR_RANGES: { sign: StarSign; endMonth: number; endDay: number }[] = [
  { sign: '염소자리', endMonth: 1, endDay: 19 },
  { sign: '물병자리', endMonth: 2, endDay: 18 },
  { sign: '물고기자리', endMonth: 3, endDay: 20 },
  { sign: '양자리', endMonth: 4, endDay: 19 },
  { sign: '황소자리', endMonth: 5, endDay: 20 },
  { sign: '쌍둥이자리', endMonth: 6, endDay: 21 },
  { sign: '게자리', endMonth: 7, endDay: 22 },
  { sign: '사자자리', endMonth: 8, endDay: 22 },
  { sign: '처녀자리', endMonth: 9, endDay: 22 },
  { sign: '천칭자리', endMonth: 10, endDay: 23 },
  { sign: '전갈자리', endMonth: 11, endDay: 22 },
  { sign: '사수자리', endMonth: 12, endDay: 21 },
  { sign: '염소자리', endMonth: 12, endDay: 31 },
];

export function deriveStarSign(month: number, day: number): StarSign {
  for (const range of STAR_RANGES) {
    if (month < range.endMonth || (month === range.endMonth && day <= range.endDay)) {
      return range.sign;
    }
  }
  return '염소자리';
}

export function deriveSigns(birthdate: string): UserSigns {
  const [yearStr, monthStr, dayStr] = birthdate.split('-');
  return {
    diiSign: deriveDiiSign(Number(yearStr)),
    starSign: deriveStarSign(Number(monthStr), Number(dayStr)),
  };
}
