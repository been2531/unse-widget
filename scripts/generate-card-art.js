// 카드 캐릭터 아트 생성 — Pollinations.ai Flux
// 스타일: 한국신화 판타지 디지털 일러스트 (kawaii/chibi 아님)
// 실행: node scripts/generate-card-art.js
// 출력: scripts/test-output/cards/

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT_DIR = path.join(__dirname, 'test-output', 'cards');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 512, H = 512;

// 공통 스타일 베이스 — 배경 유지 (배경 제거하지 않음, 고급스러운 분위기 살림)
const BASE = 'Korean mythology digital art, CCG card illustration style, ' +
  'single creature centered, full body visible, ' +
  'professional mobile card game art, rich atmospheric background, no text, no border, no frame';

// 등급별 분위기 차별화
// COMMON: 어리고 약한 존재, 잔잔한 분위기
const STYLE_COMMON =
  'Korean mythology folk art style, ' +
  'soft gentle lighting, simple clean light background, ' +
  'juvenile young creature form, limited nascent magical power, ' +
  'soft pastel glow, early growth stage, humble modest presence, ' + BASE;

// RARE: 성장 중, 힘이 생기기 시작
const STYLE_RARE =
  'Korean mythology fantasy digital art, ' +
  'dynamic lighting, developing magical energy, ' +
  'growing spiritual power, atmospheric mid-tone background, ' +
  'moderate glowing aura, confident presence, ' + BASE;

// EPIC+: 강렬하고 웅장, 극적인 연출
const STYLE_EPIC =
  'Korean mythology fantasy digital art, detailed CCG card illustration style, ' +
  'dramatic lighting, ethereal spirit energy, dark atmospheric background, ' +
  'glowing magical aura, painterly fine art, mystical and powerful presence, ' + BASE;

const NEGATIVE =
  'chibi, kawaii, cute, cartoon, anime, pixel art, pixelated, ' +
  'blurry, ugly, deformed, extra limbs, watermark, text, border, ' +
  'western fantasy, european, chinese deity, japanese anime style, ' +
  'multiple characters, reference sheet, collage, grid, panel, ' +
  'realistic photo, human portrait, childish, adorable';

const CARDS = [
  // ── 교체 필수 ──────────────────────────────────────────────────────────────
  {
    id: 'lightning_1', seed: 2101, rarity: 'common',
    prompt: 'Cheonbung thunder spirit of Korean mythology, infant storm deity, ' +
      'swirling golden lightning crackling around small ethereal body, ' +
      'ancient Korean shamanic aesthetic, electric blue-gold energy vortex, ' +
      'glowing storm eyes, traditional buk drum floating nearby, ' +
      'soft thundercloud atmosphere, small and young but with spirit potential, ',
  },
  {
    id: 'nature_3', seed: 2103, rarity: 'epic',
    prompt: 'Sansin Korean mountain god spirit of ancient Korea, ' +
      'venerable elder deity in white joseon hanbok ceremonial robes, ' +
      'long silver beard flowing with mountain mist, ' +
      'white tiger companion crouching beside, pine forest spirit energy, ' +
      'emerald green mountain aura, ancient divine authority, ' +
      'misty mountain peaks in background, ',
  },
  {
    id: 'nature_4', seed: 2104, rarity: 'legendary',
    prompt: 'Dangun Wanggeom founder deity of ancient Gojoseon Korea, ' +
      'powerful divine figure in bronze-age ceremonial ritual robes, ' +
      'bear and tiger totems flanking, sacred sandalwood tree Sindan behind, ' +
      'holding three celestial treasures Cheonbu-in glowing with divine light, ' +
      'golden cosmic aura, primordial Korean creation deity energy, ',
  },
  {
    id: 'light_4', seed: 2204, rarity: 'legendary',
    prompt: 'Hwanin supreme sky god of Korean cosmology, ' +
      'transcendent celestial deity radiating blinding golden-white light, ' +
      'wearing ancient Korean heavenly divine robes with cloud patterns, ' +
      'holding three glowing sacred objects Cheonbu-in, ' +
      'vast cosmic void and stars behind, absolute divine authority, ' +
      'rays of pure light emanating from body, ',
  },
  {
    id: 'fire_4', seed: 2304, rarity: 'legendary',
    prompt: 'Taeyangsinjo the great sun bird of Korean mythology, ' +
      'magnificent divine bird with blazing five-colored sacred plumage, ' +
      'osaek gold crimson azure white jade feathers radiating solar fire, ' +
      'wings fully spread wide catching sunlight, flames and sunbeams around, ' +
      'ancient Korean solar deity symbolism, ',
  },

  // ── 스타일 보완 ─────────────────────────────────────────────────────────────
  {
    id: 'fire_1', seed: 2301, rarity: 'common',
    prompt: 'Bonga young Korean phoenix hatchling, ' +
      'sacred osaek five-colored phoenix chick with vivid gold crimson azure jade plumage, ' +
      'small but with potential solar fire energy, ' +
      'Korean traditional ornamental feather patterns, warm ember eyes, ' +
      'gentle sacred flames, soft mythological presence, ',
  },
  {
    id: 'water_1', seed: 2401, rarity: 'common',
    prompt: 'Imugi young Korean water serpent dragon-to-be, ' +
      'long serpentine body with iridescent blue-green mystical scales, ' +
      'resting peacefully near mountain stream, soft curious gaze skyward, ' +
      'gentle river mist around body, ' +
      'small faint Yeouiju pearl glow nearby, young Korean water spirit, ',
  },
  {
    id: 'dark_1', seed: 2501, rarity: 'common',
    prompt: 'Dokkaebi trickster spirit of Korean folklore, ' +
      'powerful supernatural being with two wild red horns, ' +
      'brandishing ornate magic club Dokkaebi-bangmangi with star bursts, ' +
      'wearing traditional Korean tiger-pattern haori, wild hair and fierce grin, ' +
      'soft mischievous aura and small spirits, ' +
      'young Korean shamanistic spirit, ',
  },

  // ── 신규: 구미호 시리즈 ────────────────────────────────────────────────────
  {
    id: 'gumiho_1', seed: 2601, rarity: 'common',
    prompt: 'Miho young one-tailed fox spirit of Korean mythology, ' +
      'elegant young fox with lustrous amber-gold fur and one beautiful tail, ' +
      'curious bright eyes with nascent magic spark, ' +
      'light forest spirit energy, simple natural background, ' +
      'ancient Korean folk spirit aesthetic, young and charming, ',
  },
  {
    id: 'gumiho_2', seed: 2602, rarity: 'rare',
    prompt: 'Yeowoo three-tailed fox spirit growing in power, ' +
      'sleek fox with three magnificent tails fanned in display, ' +
      'growing shapeshifting aura around body, ' +
      'silver-gold fur with emerging magical shimmer, cunning amber eyes, ' +
      'ancient Korean supernatural presence, ',
  },
  {
    id: 'gumiho_3', seed: 2603, rarity: 'epic',
    prompt: 'Gumiho legendary nine-tailed fox of Korean mythology, ' +
      'breathtaking supernatural fox with nine radiant golden tails fanned wide, ' +
      'mesmerizing glowing golden fox eyes holding centuries of mystery, ' +
      'ethereal silver-white and gold spirit body, ' +
      'swirling reality-bending illusion magic and moonlight energy, ' +
      'apex supernatural being of Korean mythology, ',
  },

  // ── 신규: 이무기 시리즈 ────────────────────────────────────────────────────
  {
    id: 'imugi_1', seed: 2701, rarity: 'common',
    prompt: 'Imi young imugi water serpent of Korean rivers, ' +
      'young sinuous water serpent with soft blue-teal scales, ' +
      'resting quietly in shallow mountain stream, gentle water energy, ' +
      'small slim body, soft river mist and water droplets, ' +
      'ancient Korean water spirit beginning its long journey, ',
  },
  {
    id: 'imugi_2', seed: 2702, rarity: 'rare',
    prompt: 'Suri growing imugi serpent gaining power, ' +
      'large serpent body with deep indigo-blue iridescent scales, ' +
      'commanding the storm and deep waters, body coiled powerfully, ' +
      'swirling tempest waters and rain, intense focused gaze, ' +
      'ancient Korean river dragon spirit approaching ascension, ',
  },
  {
    id: 'imugi_3', seed: 2703, rarity: 'epic',
    prompt: 'Imugi the almost-dragon Korean water serpent, ' +
      'enormous majestic serpent with deep violet-blue dragon-like scales, ' +
      'holding luminous Yeouiju pearl of dragon ascension, ' +
      'massive storm clouds and lightning surrounding powerful body, ' +
      'proto-dragon horns beginning to form, eyes burning with ancient ambition, ' +
      'about to ascend to become a true Korean dragon, ',
  },

  // ── 신규: 삼족오 시리즈 ────────────────────────────────────────────────────
  {
    id: 'samjogo_1', seed: 2801, rarity: 'common',
    prompt: 'Sammi young Samjogo three-legged sun crow of Korean mythology, ' +
      'young three-legged black bird with distinctly visible three legs, ' +
      'small golden solar disc halo, soft emerging solar feathers, ' +
      'ancient Korean solar symbol aesthetic, curious eyes watching the sun, ',
  },
  {
    id: 'samjogo_2', seed: 2802, rarity: 'rare',
    prompt: 'Haejo adult Samjogo three-legged sun bird in full power, ' +
      'black feathered bird with three powerful legs fully visible, ' +
      'golden sun disc radiating behind spread wings, ' +
      'lightning crackling between primary feathers on wingtips, ' +
      'living inside the Korean sun, ancient celestial messenger, ',
  },
  {
    id: 'samjogo_3', seed: 2803, rarity: 'epic',
    prompt: 'Samjogo legendary three-legged sun crow of Korean ancient cosmology, ' +
      'magnificent black bird with three sacred legs, ' +
      'blazing solar disc crown of overwhelming golden fire, ' +
      'ancient cosmic bird deity living within the heart of the Korean sun, ' +
      'black feathers rimmed in solar gold, supreme celestial divine bird, ',
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
  console.log(`카드 아트 재생성 — ${CARDS.length}장 (한국신화 판타지 스타일)`);
  console.log(`출력: ${OUT_DIR}\n`);

  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const fname = `${card.id}.png`;
    const dest  = path.join(OUT_DIR, fname);
    process.stdout.write(`[${i + 1}/${CARDS.length}] ${fname} ... `);
    const t0 = Date.now();
    try {
      await download(buildUrl(card), dest);
      console.log(`완료 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.log(`실패: ${e.message}`);
    }
    if (i < CARDS.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n완료 → node scripts/apply-card-art.js 로 적용`);
}

main().catch(e => { console.error(e); process.exit(1); });
