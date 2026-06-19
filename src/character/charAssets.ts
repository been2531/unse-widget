import type { ImageRequireSource } from 'react-native';
import type { GrowthStage, Mood } from './types';

export const CHAR_IMAGES: Record<GrowthStage, Record<Mood, ImageRequireSource>> = {
  egg: {
    neutral: require('../assets/character/egg-neutral.png'),
    joyful:  require('../assets/character/egg-joyful.png'),
    lonely:  require('../assets/character/egg-lonely.png'),
  },
  newborn: {
    neutral: require('../assets/character/newborn-neutral.png'),
    joyful:  require('../assets/character/newborn-joyful.png'),
    lonely:  require('../assets/character/newborn-lonely.png'),
  },
  infant: {
    neutral: require('../assets/character/infant-neutral.png'),
    joyful:  require('../assets/character/infant-joyful.png'),
    lonely:  require('../assets/character/infant-lonely.png'),
  },
  child: {
    neutral: require('../assets/character/child-neutral.png'),
    joyful:  require('../assets/character/child-joyful.png'),
    lonely:  require('../assets/character/child-lonely.png'),
  },
  adolescent: {
    neutral: require('../assets/character/adolescent-neutral.png'),
    joyful:  require('../assets/character/adolescent-joyful.png'),
    lonely:  require('../assets/character/adolescent-lonely.png'),
  },
  youngAdult: {
    neutral: require('../assets/character/youngAdult-neutral.png'),
    joyful:  require('../assets/character/youngAdult-joyful.png'),
    lonely:  require('../assets/character/youngAdult-lonely.png'),
  },
  elder: {
    neutral: require('../assets/character/elder-neutral.png'),
    joyful:  require('../assets/character/elder-joyful.png'),
    lonely:  require('../assets/character/elder-lonely.png'),
  },
};
