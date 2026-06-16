import type { DiiSign, StarSign } from './types';

export const DII_SLUG: Record<DiiSign, string> = {
  쥐: 'rat',
  소: 'ox',
  호랑이: 'tiger',
  토끼: 'rabbit',
  용: 'dragon',
  뱀: 'snake',
  말: 'horse',
  양: 'goat',
  원숭이: 'monkey',
  닭: 'rooster',
  개: 'dog',
  돼지: 'pig',
};

export const STAR_SLUG: Record<StarSign, string> = {
  양자리: 'aries',
  황소자리: 'taurus',
  쌍둥이자리: 'gemini',
  게자리: 'cancer',
  사자자리: 'leo',
  처녀자리: 'virgo',
  천칭자리: 'libra',
  전갈자리: 'scorpio',
  사수자리: 'sagittarius',
  염소자리: 'capricorn',
  물병자리: 'aquarius',
  물고기자리: 'pisces',
};
