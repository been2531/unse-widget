// 카드 아트 재생성 v2 — 배경 없는 14장 재생성 (어두운 배경 강조)
// 실행: node scripts/generate-card-art-v2.js
// 출력: scripts/test-output/cards/
//
// OK (건드리지 않음): cheongnyong_1/2/3, dokkaebi_1/2/3, haetae_1/2/3,
//   hyeonmu_1/2/3, baekho_1/2/3, lightning_3, dark_2/4, bonghwang_2/3

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT_DIR = path.join(__dirname, 'test-output', 'cards');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 512, H = 768;

const STYLE_COMMON =
  'Korean mythology folk art style, Pokemon Basic card composition, ' +
  '3/4 body shot showing full creature form and face, ' +
  'DARK rich atmospheric background with deep shadow and mood, ' +
  'juvenile young creature form, early growth stage, humble modest presence, ' +
  'expressive eyes visible, creature centered in frame, ' +
  'professional CCG card illustration, no text, no border, no frame';

const STYLE_RARE =
  'Korean mythology fantasy digital art, Pokemon EX card composition, ' +
  'upper body portrait shot, face clearly prominent, dynamic confident pose, ' +
  'dynamic dramatic lighting from side, developing magical energy, ' +
  'DARK rich atmospheric background with moody depth and shadow, ' +
  'creature fills 70% of frame, expressive glowing eyes, ' +
  'professional CCG card illustration, no text, no border, no frame';

const STYLE_EPIC =
  'Korean mythology fantasy digital art, Pokemon VMAX card composition, ' +
  'dramatic bust shot to face close-up, eyes and face dominate the frame, ' +
  'creature fills 80% of frame, powerful dramatic gaze directly at viewer, ' +
  'cinematic lighting with rim light and God rays, ethereal spirit energy erupting, ' +
  'DARK atmospheric background with magical particles and deep shadow, ' +
  'glowing magical aura, painterly fine art, apex supernatural presence, ' +
  'professional CCG card illustration, no text, no border, no frame';

const NEGATIVE =
  'chibi, kawaii, cute, cartoon, anime, pixel art, pixelated, ' +
  'blurry, ugly, deformed, extra limbs, watermark, text, border, frame, ' +
  'western fantasy, european, chinese deity, japanese anime style, ' +
  'multiple characters, reference sheet, collage, grid, panel, ' +
  'realistic photo, childish, adorable, ' +
  'full body tiny in frame, creature too small, wide establishing shot, ' +
  'landscape without creature, ' +
  'white background, plain white background, bright white, solid white, ' +
  'light background, pale background, pastel background, flat background, ' +
  'monochrome white, empty background, no background, transparent background';

const CARDS = [
  // ── fire ──────────────────────────────────────────────────────────────────
  {
    id: 'fire_2', seed: 4001, rarity: 'rare',
    prompt: 'Bonghwang Korean immortal five-colored phoenix in stunning display, ' +
      'magnificent sacred bird with vivid osaek plumage gold crimson azure white jade feathers, ' +
      'reborn from sacred ashes of eternal flame, immortal divine fire from spread wings, ' +
      'traditional Korean divine bird symbolism, mid-flight ascent pose, ' +
      'deep crimson and indigo background with luminous fire particles, ',
  },
  {
    id: 'fire_3', seed: 4002, rarity: 'epic',
    prompt: 'Samjogo divine three-legged sun crow of ancient Korean cosmology, ' +
      'celestial black bird with three distinct sacred legs prominently visible, ' +
      'living blazing solar disc crown of overwhelming golden fire behind, ' +
      'black sacred feathers rimmed in radiant solar gold, ' +
      'ancient cosmic bird deity within the heart of the Korean sun, ' +
      'deep space dark background with solar fire glow, ',
  },

  // ── water ─────────────────────────────────────────────────────────────────
  {
    id: 'water_2', seed: 4101, rarity: 'rare',
    prompt: 'Yongnyeo daughter of Korean dragon king, ethereal sea princess, ' +
      'beautiful divine woman with flowing blue-green silk robes shimmering like deep ocean, ' +
      'pearl crown and sea-green jade ornaments, dark teal hair like ocean currents, ' +
      'her tears become pearls, guardian of the East Sea, ' +
      'deep ocean background with bioluminescent sea glow, ',
  },
  {
    id: 'water_3', seed: 4102, rarity: 'epic',
    prompt: 'Yongwang supreme dragon king of the Korean four seas, ' +
      'magnificent dragon-scaled armor in deep indigo-gold, long beard like ocean currents, ' +
      'holding golden trident with sea dragon insignia, commanding divine ocean authority, ' +
      'dark midnight blue ocean background with bioluminescent energy, ',
  },
  {
    id: 'water_4', seed: 4103, rarity: 'epic',
    prompt: 'Habaek ancient Korean river god, primordial deity of all rivers and waterways, ' +
      'powerful elder deity in silver-blue ceremonial robes flowing like great rivers, ' +
      'water dragon crown with river pearl, grandfather of hero Jumong, ' +
      'commanding vast river currents and tides, ancient divine authority over waterways, ' +
      'dark deep river depths background with bioluminescent water energy, ',
  },

  // ── lightning ─────────────────────────────────────────────────────────────
  {
    id: 'lightning_2', seed: 4201, rarity: 'rare',
    prompt: 'Noegong Korean thunder drum deity riding storm clouds, ' +
      'celestial warrior god wielding enormous divine thunder drum buk, ' +
      'striking lightning arrows with blazing golden fist, ' +
      'muscular commanding divine presence with thunder energy crackling, ' +
      'dark storm cloud background with lightning bolts erupting, ',
  },
  {
    id: 'lightning_4', seed: 4203, rarity: 'epic',
    prompt: 'Okhwang Jade Emperor supreme ruler of all Korean heavens, ' +
      'magnificent transcendent deity in gleaming golden celestial dragon robes, ' +
      'imperial presence commanding all heavenly deities and nature forces, ' +
      'holding jade imperial scepter radiating divine authority, ' +
      'dark celestial void background with golden heaven clouds, ',
  },

  // ── nature ────────────────────────────────────────────────────────────────
  {
    id: 'nature_1', seed: 4301, rarity: 'common',
    prompt: 'Sansini infant Korean mountain spirit, young mountain deity elder, ' +
      'small child with silver-white hair and rosy cheeks, white tiger cub companion, ' +
      'green sprouts blooming from each footstep, innocent divine mountain child, ' +
      'deep misty mountain forest background with ancient pine trees and green atmospheric glow, ',
  },
  {
    id: 'nature_2', seed: 4302, rarity: 'rare',
    prompt: 'Jisin Korean earth deity controlling the living land, ' +
      'powerful earth spirit in dark earth-toned ceremonial robes with root and stone patterns, ' +
      'hands pressed to earth awakening seeds, amber-brown earth energy radiating, ' +
      'deep roots and ancient stone around, ancient earth authority, ' +
      'dark rich soil and ancient forest roots background, ',
  },

  // ── dark ──────────────────────────────────────────────────────────────────
  {
    id: 'dark_3', seed: 4402, rarity: 'epic',
    prompt: 'Yeomra king of the Korean underworld on judgment throne, ' +
      'majestic ruler in dark-gold ceremonial dragon armor wreathed in purple-black flames, ' +
      'holding the Book of Karma Saengsa-bigi glowing with fate energy, ' +
      'overwhelming divine judicial authority of the afterlife, ' +
      'dark obsidian throne surrounded by black flames, deep underworld darkness background, ',
  },

  // ── light ─────────────────────────────────────────────────────────────────
  {
    id: 'light_1', seed: 4501, rarity: 'common',
    prompt: 'Seonnyeo young Korean celestial fairy maiden descended from heaven, ' +
      'graceful young divine woman in flowing pale-gold silk hanbok with gossamer celestial wings, ' +
      'flower petals falling around her in divine shower, innocent celestial presence, ' +
      'DARK deep midnight blue celestial heaven background with stars and moonbeams, ' +
      'her glowing form contrasts beautifully against the dark heavenly void, ',
  },
  {
    id: 'light_2', seed: 4502, rarity: 'rare',
    prompt: 'Dalnim Korean moon goddess guardian of the lunar realm, ' +
      'beautiful divine woman in silver-white flowing ceremonial robes, ' +
      'elegant crescent moon crown with pearl ornaments, ' +
      'moonlight radiating from her gentle divine form, full moon glowing behind, ' +
      'DARK midnight sky background with stars, silver-blue lunar energy, ',
  },
  {
    id: 'light_3', seed: 4503, rarity: 'epic',
    prompt: 'Haemosu Korean solar prince son of the Heavenly Emperor, ' +
      'magnificent warrior-deity riding celestial five-dragon chariot Oryongeo, ' +
      'blazing golden solar armor and radiant divine crown, ' +
      'commanding five sacred dragons pulling the sun across the heavens, ' +
      'DARK cosmic sky background with blazing sunrise golden light, father of Jumong the hero, ',
  },

  // ── bonghwang_1 ───────────────────────────────────────────────────────────
  {
    id: 'bonghwang_1', seed: 4601, rarity: 'common',
    prompt: 'Young Bonghwang phoenix hatchling of Korean immortal mythology, ' +
      'small sacred bird chick with vibrant osaek five-colored feathers gold crimson azure white jade, ' +
      'innocent large eyes with ancient wisdom within, ' +
      'small feathers ruffled with nascent divine fire energy, ' +
      'sacred phoenix of paradise beginning its eternal journey, ' +
      'DARK rich crimson-indigo background with soft ember spark glow, ',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close(); fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${res.statusCode}`)); return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    req.setTimeout(90000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function getStyle(rarity) {
  if (rarity === 'common') return STYLE_COMMON;
  if (rarity === 'rare')   return STYLE_RARE;
  return STYLE_EPIC;
}

function buildUrl(card) {
  const fullPrompt = card.prompt + getStyle(card.rarity || 'epic');
  const prompt   = encodeURIComponent(fullPrompt);
  const negative = encodeURIComponent(NEGATIVE);
  return (
    `https://image.pollinations.ai/prompt/${prompt}` +
    `?width=${W}&height=${H}&nologo=true&seed=${card.seed}&model=flux&negative=${negative}`
  );
}

async function main() {
  const logPath = path.join(__dirname, 'card-gen-v2.log');
  const log = fs.createWriteStream(logPath, { flags: 'w' });
  const out = (s) => { process.stdout.write(s); log.write(s); };

  out(`카드 아트 재생성 v2 — ${CARDS.length}장 (배경 없는 카드 교체)\n`);
  out(`출력: ${OUT_DIR}\n\n`);

  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const fname = `${card.id}.png`;
    const dest  = path.join(OUT_DIR, fname);
    out(`[${i + 1}/${CARDS.length}] ${fname} ... `);
    const t0 = Date.now();
    try {
      await download(buildUrl(card), dest);
      out(`완료 (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);
    } catch (e) {
      out(`실패: ${e.message}\n`);
    }
    if (i < CARDS.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  log.end();
  console.log(`\n완료 → node scripts/apply-card-art.js 로 적용`);
}

main().catch(e => { console.error(e); process.exit(1); });
