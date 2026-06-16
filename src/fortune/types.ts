export type DiiSign =
  | '쥐'
  | '소'
  | '호랑이'
  | '토끼'
  | '용'
  | '뱀'
  | '말'
  | '양'
  | '원숭이'
  | '닭'
  | '개'
  | '돼지';

export type StarSign =
  | '양자리'
  | '황소자리'
  | '쌍둥이자리'
  | '게자리'
  | '사자자리'
  | '처녀자리'
  | '천칭자리'
  | '전갈자리'
  | '사수자리'
  | '염소자리'
  | '물병자리'
  | '물고기자리';

export type FortuneCategory = '총운' | '연애' | '직장' | '금전' | '건강';

export interface FortuneEntry {
  id: string;
  text: string;
  category?: FortuneCategory;
}

export interface UserSigns {
  diiSign: DiiSign;
  starSign: StarSign;
}

export interface UserProfile extends UserSigns {
  birthdate: string; // ISO date string, YYYY-MM-DD
  onboardingComplete: true;
}

export interface DailyFortune {
  date: string; // YYYY-MM-DD
  general: FortuneEntry;
  dii: FortuneEntry;
  star: FortuneEntry;
}
