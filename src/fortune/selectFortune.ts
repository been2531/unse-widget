import generalPool from '../assets/content/general.json';
import wealthPool from '../assets/content/wealth.json';
import lovePool from '../assets/content/love.json';
import healthPool from '../assets/content/health.json';
import workPool from '../assets/content/work.json';
import diiRat from '../assets/content/by-dii/rat.json';
import diiOx from '../assets/content/by-dii/ox.json';
import diiTiger from '../assets/content/by-dii/tiger.json';
import diiRabbit from '../assets/content/by-dii/rabbit.json';
import diiDragon from '../assets/content/by-dii/dragon.json';
import diiSnake from '../assets/content/by-dii/snake.json';
import diiHorse from '../assets/content/by-dii/horse.json';
import diiGoat from '../assets/content/by-dii/goat.json';
import diiMonkey from '../assets/content/by-dii/monkey.json';
import diiRooster from '../assets/content/by-dii/rooster.json';
import diiDog from '../assets/content/by-dii/dog.json';
import diiPig from '../assets/content/by-dii/pig.json';
import starAries from '../assets/content/by-star/aries.json';
import starTaurus from '../assets/content/by-star/taurus.json';
import starGemini from '../assets/content/by-star/gemini.json';
import starCancer from '../assets/content/by-star/cancer.json';
import starLeo from '../assets/content/by-star/leo.json';
import starVirgo from '../assets/content/by-star/virgo.json';
import starLibra from '../assets/content/by-star/libra.json';
import starScorpio from '../assets/content/by-star/scorpio.json';
import starSagittarius from '../assets/content/by-star/sagittarius.json';
import starCapricorn from '../assets/content/by-star/capricorn.json';
import starAquarius from '../assets/content/by-star/aquarius.json';
import starPisces from '../assets/content/by-star/pisces.json';

import { fnv1aHash } from './hash';
import { DII_SLUG, STAR_SLUG } from './signSlugs';
import type { DailyFortune, DiiSign, FortuneEntry, StarSign } from './types';

// Metro requires static import paths, so every per-sign content file is
// imported individually and assembled into lookup tables here rather than
// resolved with a dynamic require(`./by-dii/${sign}.json`).
const DII_POOLS: Record<string, FortuneEntry[]> = {
  rat: diiRat,
  ox: diiOx,
  tiger: diiTiger,
  rabbit: diiRabbit,
  dragon: diiDragon,
  snake: diiSnake,
  horse: diiHorse,
  goat: diiGoat,
  monkey: diiMonkey,
  rooster: diiRooster,
  dog: diiDog,
  pig: diiPig,
};

const STAR_POOLS: Record<string, FortuneEntry[]> = {
  aries: starAries,
  taurus: starTaurus,
  gemini: starGemini,
  cancer: starCancer,
  leo: starLeo,
  virgo: starVirgo,
  libra: starLibra,
  scorpio: starScorpio,
  sagittarius: starSagittarius,
  capricorn: starCapricorn,
  aquarius: starAquarius,
  pisces: starPisces,
};

function pick(pool: FortuneEntry[], seed: number): FortuneEntry {
  return pool[seed % pool.length];
}

export function selectDailyFortune(date: string, diiSign: DiiSign, starSign: StarSign): DailyFortune {
  const diiPool = DII_POOLS[DII_SLUG[diiSign]];
  const starPool = STAR_POOLS[STAR_SLUG[starSign]];

  const baseSeed = `${date}:${diiSign}:${starSign}`;
  const general = pick(generalPool as FortuneEntry[], fnv1aHash(`${baseSeed}:general`));
  const dii = pick(diiPool, fnv1aHash(`${baseSeed}:dii`));
  const star = pick(starPool, fnv1aHash(`${baseSeed}:star`));

  const wealth = pick(wealthPool as FortuneEntry[], fnv1aHash(`${baseSeed}:wealth`));
  const love   = pick(lovePool   as FortuneEntry[], fnv1aHash(`${baseSeed}:love`));
  const health = pick(healthPool as FortuneEntry[], fnv1aHash(`${baseSeed}:health`));
  const work   = pick(workPool   as FortuneEntry[], fnv1aHash(`${baseSeed}:work`));

  return { date, general, wealth, love, health, work, dii, star };
}
