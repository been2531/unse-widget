// 가차 카드 캐릭터 아트 생성 — 한국신화 테마 (Pollinations.ai, 가입 불필요)
// 6원소 × 4단계 = 24장
// 실행: node scripts/generate-card-characters.js
// 출력: scripts/test-output/cards/ → 완료 후 src/assets/character/ 에 자동 복사

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT_DIR    = path.join(__dirname, 'test-output', 'cards');
const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets', 'character');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 512, H = 512;
const SEED = 9142;

// ── 공통 스타일 ──────────────────────────────────────────────────────────────
const STYLE =
  'single character, centered, full body, white background, ' +
  'Korean mythology TCG card illustration, cel shading, clean smooth outlines, ' +
  'vibrant saturated colors, dynamic pose, high quality digital art';

const NEGATIVE =
  'multiple characters, collage, grid, realistic photograph, ' +
  'blurry, deformed, extra limbs, watermark, text, border, frame, background scenery, ' +
  'western fantasy, generic dragon without Korean style';

// ── 24 캐릭터 ────────────────────────────────────────────────────────────────
const CHARACTERS = [

  // ── 봉황 계열 (fire) ──────────────────────────────────────────────────────
  {
    id: 'fire_1', nameKo: '봉아',
    prompt:
      'cute chibi baby Korean phoenix Bonghwang chick, ' +
      'tiny fluffy five-colored feathers, round chubby baby bird body, ' +
      'huge innocent eyes, stubby little wings, warm ember sparks floating, ' +
      'warm orange-gold color palette, ' + STYLE,
  },
  {
    id: 'fire_2', nameKo: '봉황',
    prompt:
      'young Korean mythological phoenix Bonghwang, ' +
      'elegant five-colored plumage red green blue yellow white, ' +
      'spread wings showing full feather glory, regal upright pose, ' +
      'flame aura at wing tips, glowing amber eyes, ' +
      'rich red-gold color palette, ' + STYLE,
  },
  {
    id: 'fire_3', nameKo: '삼족오',
    prompt:
      'Samjogo Korean three-legged sun crow, ' +
      'sleek jet-black feathers with blazing golden solar glow at edges, ' +
      'three powerful clawed legs visible, wings fully spread, ' +
      'radiant sun disc halo behind head, fierce ember eyes, ' +
      'dramatic black and gold solar color palette, ' + STYLE,
  },
  {
    id: 'fire_4', nameKo: '태양신조',
    prompt:
      'divine Korean solar deity bird Taeyangsinjo, ' +
      'enormous radiant wings of pure solar fire, ' +
      'blazing white-gold feathers with sunflare tips, ' +
      'divine golden halo of flames, celestial awe-inspiring presence, ' +
      'transcendent white-gold fire color palette, ' + STYLE,
  },

  // ── 이무기·용 계열 (water) ────────────────────────────────────────────────
  {
    id: 'water_1', nameKo: '이무기',
    prompt:
      'cute chibi baby imugi Korean water serpent, ' +
      'small coiled serpent body, soft teal-blue shimmering scales, ' +
      'no claws yet, tiny fin crests, wide innocent watery eyes, ' +
      'water droplets and small bubbles floating around, ' +
      'pastel aqua blue color palette, ' + STYLE,
  },
  {
    id: 'water_2', nameKo: '용녀',
    prompt:
      'Korean dragon maiden Yongnyeo, elegant young woman with dragon horns and tail, ' +
      'flowing ocean-blue hanbok with dragon scale patterns, holds glowing orb, ' +
      'graceful beauty, ocean wave motifs around her, ' +
      'teal-blue and white color palette, ' + STYLE,
  },
  {
    id: 'water_3', nameKo: '용왕',
    prompt:
      'Korean Dragon King Yongwang, powerful male deity in dragon-lord form, ' +
      'magnificent royal robes with ocean wave and dragon patterns, golden dragon crown, ' +
      'commanding majestic presence, deep sapphire dragon aura, ' +
      'dark ocean blue and gold color palette, ' + STYLE,
  },
  {
    id: 'water_4', nameKo: '하백',
    prompt:
      'Habaek Korean river god, powerful divine male figure in silver-blue flowing robes, ' +
      'hair flowing like rivers, surrounded by sacred fish and water currents, ' +
      'trident staff of the rivers, silver-blue divine energy, ' +
      'silver and deep blue color palette, ' + STYLE,
  },

  // ── 뇌신 계열 (lightning) ─────────────────────────────────────────────────
  {
    id: 'lightning_1', nameKo: '천붕이',
    prompt:
      'cute chibi baby Korean thunder spirit child, ' +
      'round chubby toddler with storm cloud puff hair, tiny yellow lightning bolts, ' +
      'surprised delighted expression, electric sparks dancing around, ' +
      'bright electric yellow-blue color palette, ' + STYLE,
  },
  {
    id: 'lightning_2', nameKo: '뇌공',
    prompt:
      'Noegong Korean thunder duke, powerful warrior deity, ' +
      'golden armor engraved with lightning bolt patterns, ' +
      'raises a heavenly drum mallet, crackling electric aura surrounding body, ' +
      'bold dynamic striking pose, gold-blue electric color palette, ' + STYLE,
  },
  {
    id: 'lightning_3', nameKo: '뇌신',
    prompt:
      'Noesin Korean god of thunder, fierce divine warrior, ' +
      'dark indigo armor with blazing golden lightning runes, ' +
      'storm clouds swirling behind, lightning bolts at command, ' +
      'piercing electric white eyes, powerful heroic stance, ' +
      'dark indigo and electric gold color palette, ' + STYLE,
  },
  {
    id: 'lightning_4', nameKo: '옥황',
    prompt:
      'Okhwang Korean Jade Emperor, supreme ruler of heaven, ' +
      'resplendent imperial jade-gold robes, ornate celestial crown, ' +
      'commands lightning with fingertip, divine absolute authority, ' +
      'all celestial deities bow before him, ' +
      'imperial jade green and gold color palette, ' + STYLE,
  },

  // ── 산신 계열 (nature) ────────────────────────────────────────────────────
  {
    id: 'nature_1', nameKo: '산신이',
    prompt:
      'cute chibi baby Korean mountain spirit, ' +
      'adorable tiny old-man-child with tiny white beard stubble, acorn hat, ' +
      'little tiger cub companion beside him, mossy green robes, ' +
      'mushrooms and wildflowers blooming around feet, ' +
      'warm soft forest green-brown color palette, ' + STYLE,
  },
  {
    id: 'nature_2', nameKo: '지신',
    prompt:
      'Jisin Korean earth deity, powerful female figure rising from the earth, ' +
      'earthy clay-brown and moss-green hanbok, ancient tree root and flower motifs, ' +
      'flowers blooming in her wake, grounded powerful stance, ' +
      'rich terracotta and forest green color palette, ' + STYLE,
  },
  {
    id: 'nature_3', nameKo: '산신',
    prompt:
      'Sansin Korean mountain god, wise ancient man with flowing silver beard, ' +
      'majestic sage robes in forest green, mighty tiger at his side, ' +
      'pine tree and mountain energy surrounding, calm divine authority, ' +
      'silver-white and deep forest green color palette, ' + STYLE,
  },
  {
    id: 'nature_4', nameKo: '단군',
    prompt:
      'Dangun mythical founder of ancient Joseon, divine half-deity king, ' +
      'ancient Korean royal robes adorned with bear and sun motifs, ' +
      'noble commanding presence, bear totem spirit floating nearby, ' +
      'celestial mountains behind, ancient divine-king energy, ' +
      'golden-amber and deep brown color palette, ' + STYLE,
  },

  // ── 도깨비 계열 (dark) ────────────────────────────────────────────────────
  {
    id: 'dark_1', nameKo: '도깨비',
    prompt:
      'cute chibi baby Korean Dokkaebi goblin, ' +
      'small chubby teal-green skin goblin child, tiny gnarled club, ' +
      'wild spiky hair, mischievous grinning expression, round glowing eyes, ' +
      'purple star-sparks, dark teal-purple color palette, ' + STYLE,
  },
  {
    id: 'dark_2', nameKo: '저승사자',
    prompt:
      'Jeoseung Saja Korean underworld messenger, ' +
      'stoic pale-faced figure in midnight-black official robes and gat hat, ' +
      'carries a ghostly lantern with soul-flame inside, ' +
      'ethereal calm presence, shadow wisps trailing, ' +
      'deep navy-black and cold blue color palette, ' + STYLE,
  },
  {
    id: 'dark_3', nameKo: '염라대왕',
    prompt:
      'Yeomra great king of the Korean underworld, ' +
      'imposing powerful judge in dark crimson-black armor, ' +
      'holds a judgment scroll, eyes blazing with crimson fire, ' +
      'underworld flames and souls swirling at feet, ' +
      'dark crimson and smoldering gold color palette, ' + STYLE,
  },
  {
    id: 'dark_4', nameKo: '명부왕',
    prompt:
      'Myeongwang supreme lord of Korean death and fate, ' +
      'ancient ethereal figure in cosmic void robes filled with stars and souls, ' +
      'ageless transcendent face, holds the book of fate, ' +
      'reality bends around him, ' +
      'deep cosmic purple-black with star-silver color palette, ' + STYLE,
  },

  // ── 선녀 계열 (light) ─────────────────────────────────────────────────────
  {
    id: 'light_1', nameKo: '선녀',
    prompt:
      'cute chibi baby Korean celestial fairy Seonnyeo, ' +
      'tiny girl in flowing white-gold feathered hanbok, delicate fairy wings, ' +
      'flower petals raining around her, softly glowing with warm light, ' +
      'sparkling gentle eyes, pastel gold and white color palette, ' + STYLE,
  },
  {
    id: 'light_2', nameKo: '달님',
    prompt:
      'Dalnim Korean moon goddess, ethereal graceful woman in silver-white robes, ' +
      'crescent moon halo crown, moonbeam flowing silver hair, ' +
      'silver star motifs on dress, serene radiant beauty, ' +
      'cool silver-white and pale blue color palette, ' + STYLE,
  },
  {
    id: 'light_3', nameKo: '해모수',
    prompt:
      'Haemosu Korean sun god hero from Jumong legend, ' +
      'radiant young male deity in blazing golden armor-robes, ' +
      'rides five-dragon chariot motif, solar crown blazing, ' +
      'brilliant light pouring from body, heroic divine presence, ' +
      'divine gold and radiant orange color palette, ' + STYLE,
  },
  {
    id: 'light_4', nameKo: '환인',
    prompt:
      'Hwanim supreme Korean sky god, ancient divine patriarch of all creation, ' +
      'celestial white-gold robes embroidered with cosmos patterns, ' +
      'three jade talismans hovering in hand, eternal heavenly light radiating, ' +
      'absolute divine authority, universe behind, ' +
      'transcendent white-gold and azure color palette, ' + STYLE,
  },
];

// ── 다운로드 ──────────────────────────────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req  = https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close(); fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${res.statusCode}`)); return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function buildUrl(char) {
  const p = encodeURIComponent(char.prompt);
  const n = encodeURIComponent(NEGATIVE);
  return `https://image.pollinations.ai/prompt/${p}?width=${W}&height=${H}&nologo=true&seed=${SEED}&model=flux&negative=${n}`;
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`한국신화 카드 캐릭터 생성 — 총 ${CHARACTERS.length}장`);
  console.log(`출력: ${OUT_DIR}\n`);

  const failed = [];

  for (let i = 0; i < CHARACTERS.length; i++) {
    const char = CHARACTERS[i];
    const dest = path.join(OUT_DIR, `${char.id}.png`);
    const url  = buildUrl(char);

    process.stdout.write(`[${i + 1}/${CHARACTERS.length}] ${char.id} (${char.nameKo}) ... `);
    const t0 = Date.now();
    try {
      await download(url, dest);
      console.log(`완료 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.log(`실패: ${e.message}`);
      failed.push(char.id);
    }

    if (i < CHARACTERS.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  // ── 성공한 파일 → src/assets/character/ 자동 복사
  console.log('\n─── assets 폴더에 복사 중...');
  let copied = 0;
  for (const char of CHARACTERS) {
    const src  = path.join(OUT_DIR, `${char.id}.png`);
    const dest = path.join(ASSETS_DIR, `${char.id}.png`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }

  console.log(`\n완료 — ${copied}/${CHARACTERS.length}장 복사됨 → ${ASSETS_DIR}`);
  if (failed.length) console.log(`실패: ${failed.join(', ')}`);
}

main().catch(e => { console.error(e); process.exit(1); });
