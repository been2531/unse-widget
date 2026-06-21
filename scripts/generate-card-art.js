// 카드 캐릭터 아트 생성 — Pollinations.ai Flux
// 스타일: 한국신화 판타지 디지털 일러스트 (kawaii/chibi 아님)
// 실행: node scripts/generate-card-art.js
// 출력: scripts/test-output/cards/

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT_DIR = path.join(__dirname, 'test-output', 'cards');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 512, H = 768; // 세로 비율 카드 포맷 (포켓몬 TCG 비율 참고)

// ── 구도 기준 (포켓몬 TCG V/VMAX 카드 스타일 참고) ──────────────────────────
// COMMON (Basic급): 3/4 바디 샷 — 전체적인 실루엣 강조, 표정 보임
// RARE (EX/GX급):  상반신 샷 — 얼굴+몸 균형, 역동적 포즈
// EPIC+ (V/VMAX급): 흉상~극클로즈업 — 얼굴·눈이 프레임 지배, 배경과 빛 융합
//
// 공통: 배경 유지, 캐릭터와 배경이 빛으로 자연스럽게 융합

// COMMON: 3/4 바디, 소박한 분위기 (Basic 카드급)
const STYLE_COMMON =
  'Korean mythology folk art style, Pokemon Basic card composition, ' +
  '3/4 body shot showing full creature form and face, ' +
  'soft gentle lighting from above, simple atmospheric background with soft glow, ' +
  'juvenile young creature form, early growth stage, humble modest presence, ' +
  'expressive eyes visible, creature centered in frame, ' +
  'professional CCG card illustration, rich atmospheric background, no text, no border, no frame';

// RARE: 상반신, 역동적 (EX/GX급)
const STYLE_RARE =
  'Korean mythology fantasy digital art, Pokemon EX card composition, ' +
  'upper body portrait shot, face clearly prominent, dynamic confident pose, ' +
  'dynamic lighting from side, developing magical energy radiating outward, ' +
  'growing spiritual power, rich mid-tone atmospheric background, ' +
  'creature fills 70% of frame, expressive glowing eyes, ' +
  'professional CCG card illustration, no text, no border, no frame';

// EPIC+: 흉상~클로즈업, 극적 (V/VMAX급)
const STYLE_EPIC =
  'Korean mythology fantasy digital art, Pokemon VMAX card composition, ' +
  'dramatic bust shot to face close-up, eyes and face dominate the frame, ' +
  'creature fills 80% of frame, powerful dramatic gaze directly at viewer, ' +
  'cinematic lighting with rim light and God rays, ethereal spirit energy erupting, ' +
  'dark atmospheric background with magical particles, creature and background merge through light, ' +
  'glowing magical aura, painterly fine art, apex supernatural presence, ' +
  'professional CCG card illustration, no text, no border, no frame';

const NEGATIVE =
  'chibi, kawaii, cute, cartoon, anime, pixel art, pixelated, ' +
  'blurry, ugly, deformed, extra limbs, watermark, text, border, frame, ' +
  'western fantasy, european, chinese deity, japanese anime style, ' +
  'multiple characters, reference sheet, collage, grid, panel, ' +
  'realistic photo, human portrait, childish, adorable, ' +
  'full body tiny in frame, creature too small, wide establishing shot, ' +
  'landscape without creature, empty background';

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

  // ── 신규: 주작 시리즈 ─────────────────────────────────────────────────────
  // 주작 = 남방 수호신, 불새. 봉황(오색 평화)과 달리 → 전투적·방위신·선명한 주홍색
  {
    id: 'jujak_1', seed: 2901, rarity: 'common',
    prompt: 'Jujak vermilion guardian bird of Korean mythology, young hatchling of the south celestial guardian, ' +
      'brilliant vermilion red plumage with crimson wing tips, round body with bold red-orange feathers, ' +
      'bright alert eyes watching the southern sky, ' +
      'small but proud posture, soft warm ember glow around body, ' +
      'distinct from phoenix — solid vivid red not multicolored, korean shamanic celestial bird spirit, ',
  },
  {
    id: 'jujak_2', seed: 2902, rarity: 'rare',
    prompt: 'Jujak vermilion bird of Korean southern guardian mythology, adolescent spreading wings, ' +
      'vivid scarlet and flame-red feathers blazing like southern summer sun, ' +
      'wings beginning to spread wide in display, commanding red-gold aura, ' +
      'powerful tail feathers like tongues of fire, ' +
      'guardian energy radiating southward, summer fire embodied, ' +
      'warrior bird spirit of Korean cosmos, ',
  },
  {
    id: 'jujak_3', seed: 2903, rarity: 'legendary',
    prompt: 'Jujak the supreme vermilion bird guardian of the Korean southern heavens, ' +
      'magnificent fully grown celestial guardian bird, blazing blood-red and scarlet sacred plumage, ' +
      'wings fully spread commanding the southern sky, intense warrior eyes burning with divine fire, ' +
      'crown of sacred flame, protector of the south direction, ' +
      'battle-ready divine guardian posture, overwhelming vermilion fire aura, ' +
      'one of the four divine guardians of Korean cosmology, immortal phoenix reborn from ashes, ',
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
