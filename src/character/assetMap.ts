import type { ImageRequireSource } from 'react-native';
import type { GrowthStage, Mood } from './types';

export const CHARACTER_ASSET_MAP: Record<GrowthStage, Record<Mood, ImageRequireSource>> = {
  egg: {
    joyful:  require('../assets/character/egg-joyful.png'),
    neutral: require('../assets/character/egg-neutral.png'),
    lonely:  require('../assets/character/egg-lonely.png'),
  },
  newborn: {
    joyful:  require('../assets/character/newborn-joyful.png'),
    neutral: require('../assets/character/newborn-neutral.png'),
    lonely:  require('../assets/character/newborn-lonely.png'),
  },
  infant: {
    joyful:  require('../assets/character/infant-joyful.png'),
    neutral: require('../assets/character/infant-neutral.png'),
    lonely:  require('../assets/character/infant-lonely.png'),
  },
  child: {
    joyful:  require('../assets/character/child-joyful.png'),
    neutral: require('../assets/character/child-neutral.png'),
    lonely:  require('../assets/character/child-lonely.png'),
  },
  adolescent: {
    joyful:  require('../assets/character/adolescent-joyful.png'),
    neutral: require('../assets/character/adolescent-neutral.png'),
    lonely:  require('../assets/character/adolescent-lonely.png'),
  },
  youngAdult: {
    joyful:  require('../assets/character/youngAdult-joyful.png'),
    neutral: require('../assets/character/youngAdult-neutral.png'),
    lonely:  require('../assets/character/youngAdult-lonely.png'),
  },
  elder: {
    joyful:  require('../assets/character/elder-joyful.png'),
    neutral: require('../assets/character/elder-neutral.png'),
    lonely:  require('../assets/character/elder-lonely.png'),
  },
};
