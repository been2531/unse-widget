// 가차 카드 캐릭터 아트 생성 — Pollinations.ai (가입 불필요)
// 6원소 × 3단계 = 18장
// 실행: node scripts/generate-card-characters.js
// 출력: scripts/test-output/cards/

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT_DIR = path.join(__dirname, 'test-output', 'cards');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 512, H = 512;
const SEED = 7777;

// ── 공통 스타일 ────────────────────────────────────────────────────────────────
const STYLE =
  'single character, centered, full body, white background, ' +
  'clean 2D digital illustration, flat color with soft cel shading, ' +
  'smooth clean outlines, mobile TCG card game character art style, ' +
  'vibrant saturated colors, high quality';

const NEGATIVE =
  'multiple characters, character sheet, reference sheet, collage, grid, ' +
  'human, person, realistic, photo, pixel art, 3D render, ' +
  'blurry, deformed, extra limbs, watermark, text, border, frame, background scenery';

// ── 원소별 생물 + 단계별 프롬프트 ──────────────────────────────────────────────
const CHARACTERS = [
  // ── 화염 (삼족오) ─────────────────────────────────────────────────────────────
  {
    id: 'fire_1', nameKo: '화이',
    prompt:
      'cute chibi baby three-legged crow (Korean mythological Samjogo), ' +
      'fluffy bright orange-red feathers, tiny third leg visible, ' +
      'round chubby body, huge innocent eyes, small glowing embers floating around, ' +
      'warm red-orange color palette, ' + STYLE,
  },
  {
    id: 'fire_2', nameKo: '불새',
    prompt:
      'teenage three-legged crow (Samjogo), sleek fiery red-gold feathers, ' +
      'three sharp talons, dynamic spread wings, flame aura around wingtips, ' +
      'confident bold pose, burning orange eyes, ' +
      'bright fire color palette, ' + STYLE,
  },
  {
    id: 'fire_3', nameKo: '염왕',
    prompt:
      'majestic adult three-legged crow king (Samjogo), ' +
      'magnificent scarlet and gold plumage, giant blazing wings fully spread, ' +
      'golden crown of flames on head, intense glowing ember eyes, ' +
      'dramatic powerful stance, flames swirling at feet, ' +
      'epic legendary fire color palette, ' + STYLE,
  },

  // ── 수계 (이무기) ─────────────────────────────────────────────────────────────
  {
    id: 'water_1', nameKo: '물이',
    prompt:
      'cute chibi baby imugi (Korean water serpent), ' +
      'small round serpent body, soft blue-green shimmering scales, ' +
      'no claws yet, tiny fins on head, wide watery eyes, ' +
      'water droplets floating around, pastel blue color palette, ' + STYLE,
  },
  {
    id: 'water_2', nameKo: '파람',
    prompt:
      'teenage imugi Korean sea serpent, sleek aquamarine scales, ' +
      'small elegant claws, flowing water mane, wave patterns on body, ' +
      'dynamic coiled pose, glowing teal eyes, ' +
      'cool ocean blue color palette, ' + STYLE,
  },
  {
    id: 'water_3', nameKo: '해왕',
    prompt:
      'majestic adult imugi Korean dragon king of the sea, ' +
      'enormous serpentine body with deep sapphire-silver scales, ' +
      'flowing luminous mane, large elegant claws, ' +
      'swirling ocean currents around body, regal commanding presence, ' +
      'deep ocean color palette, ' + STYLE,
  },

  // ── 번개 (백호) ───────────────────────────────────────────────────────────────
  {
    id: 'lightning_1', nameKo: '번이',
    prompt:
      'cute chibi baby white tiger cub, ' +
      'snow-white fur with pale electric blue lightning bolt stripe markings, ' +
      'round chubby body, huge bright eyes, tiny spark effects around ears, ' +
      'electric blue accent color palette, ' + STYLE,
  },
  {
    id: 'lightning_2', nameKo: '전이',
    prompt:
      'teenage white tiger, sleek white fur with glowing yellow-blue lightning stripes, ' +
      'crackling static electricity around body, sharp focused eyes, ' +
      'athletic dynamic pose, lightning sparks in background, ' +
      'electric yellow-white color palette, ' + STYLE,
  },
  {
    id: 'lightning_3', nameKo: '천왕',
    prompt:
      'majestic powerful adult white tiger, sky king, ' +
      'pristine white fur with blazing golden lightning markings, ' +
      'storm clouds swirling beneath paws, intense piercing eyes, ' +
      'golden lightning crown aura, dramatic heroic stance, ' +
      'golden storm color palette, ' + STYLE,
  },

  // ── 자연 (사슴) ───────────────────────────────────────────────────────────────
  {
    id: 'nature_1', nameKo: '솔이',
    prompt:
      'cute chibi baby jade deer fawn, ' +
      'soft mint-green fur with white flower petal spots, ' +
      'tiny budding antlers with small leaves, huge gentle eyes, ' +
      'small flowers blooming around hooves, ' +
      'soft green nature color palette, ' + STYLE,
  },
  {
    id: 'nature_2', nameKo: '풀이',
    prompt:
      'young jade deer with growing branching antlers covered in moss and small leaves, ' +
      'emerald green glowing fur, ivy vines gently curling around legs, ' +
      'serene graceful pose, ' +
      'rich forest green color palette, ' + STYLE,
  },
  {
    id: 'nature_3', nameKo: '자왕',
    prompt:
      'majestic adult jade guardian deer, ' +
      'magnificent emerald and gold fur, ' +
      'towering antlers like an ancient tree with blooming flowers and glowing leaves, ' +
      'ancient powerful presence, golden nature energy radiating, ' +
      'deep forest and gold color palette, ' + STYLE,
  },

  // ── 암흑 (구미호) ─────────────────────────────────────────────────────────────
  {
    id: 'dark_1', nameKo: '밤이',
    prompt:
      'cute chibi baby black fox kit, ' +
      'glossy midnight black fur with tiny single fluffy tail, ' +
      'purple starlight sparkles around body, curious mischievous eyes, ' +
      'dark purple night color palette, ' + STYLE,
  },
  {
    id: 'dark_2', nameKo: '흑이',
    prompt:
      'teenage black fox with three sleek dark tails, ' +
      'obsidian black fur with purple shadow aura, ' +
      'clever glowing violet eyes, shadow wisps trailing from tails, ' +
      'elegant mysterious pose, ' +
      'deep violet-black color palette, ' + STYLE,
  },
  {
    id: 'dark_3', nameKo: '어왕',
    prompt:
      'majestic adult nine-tailed black fox, lord of darkness, ' +
      'magnificent jet-black fur with nine flowing cosmic tails filled with stars, ' +
      'deep galaxy swirling within each tail, ' +
      'commanding regal presence, glowing deep purple eyes, ' +
      'cosmic dark purple-black color palette, ' + STYLE,
  },

  // ── 빛 (봉황) ─────────────────────────────────────────────────────────────────
  {
    id: 'light_1', nameKo: '빛이',
    prompt:
      'cute chibi baby phoenix chick, ' +
      'soft glowing golden-white feathers, tiny wings, round fluffy body, ' +
      'warm sparkle light particles floating around, gentle bright eyes, ' +
      'soft gold and white color palette, ' + STYLE,
  },
  {
    id: 'light_2', nameKo: '햇님',
    prompt:
      'young phoenix with spreading radiant gold and ivory wings, ' +
      'sunbeam feathers, cheerful warm expression, ' +
      'halo of soft light above head, glowing tail feathers, ' +
      'warm sunlight gold color palette, ' + STYLE,
  },
  {
    id: 'light_3', nameKo: '광왕',
    prompt:
      'majestic adult phoenix king of light, ' +
      'enormous brilliant wings of blazing white-gold and solar fire, ' +
      'divine radiance emanating from body, ' +
      'resplendent crown of pure light, awe-inspiring noble presence, ' +
      'divine white and gold color palette, ' + STYLE,
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
    req.on('error', err  => { fs.unlink(dest, () => {}); reject(err); });
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
  console.log(`카드 캐릭터 생성 시작 — 총 ${CHARACTERS.length}장`);
  console.log(`출력: ${OUT_DIR}\n`);

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
    }

    if (i < CHARACTERS.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n완료 → ${OUT_DIR}`);
  console.log('이미지 확인 후 src/assets/character/ 에 복사하세요.');
}

main().catch(e => { console.error(e); process.exit(1); });
