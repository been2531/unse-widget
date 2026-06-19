// 전체 캐릭터 아트 생성 — Pollinations.ai Flux
// 스타일: 부드러운 모바일 게임 일러스트 (pixel art 아님)
// 실행: node scripts/generate-character-art-ai.js
// 출력: scripts/test-output/ai/ 에 미리보기 후 src/assets/character/ 반영

const https = require('https');
const fs = require('fs');
const path = require('path');

const PREVIEW_DIR = path.join(__dirname, 'test-output', 'ai');
const ASSET_DIR   = path.join(__dirname, '../src/assets/character');

if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

const SEED = 4242;
const W = 512, H = 512;

const NEGATIVE =
  'pixel art, pixelated, pixel, 8-bit, 16-bit, retro, mosaic, low resolution, ' +
  'blurry, ugly, deformed, extra limbs, watermark, text, border, frame, ' +
  'realistic, photo, human, person, ' +
  'multiple characters, character sheet, reference sheet, multiple poses, ' +
  'multiple views, turnaround, lineup, collage, grid, panel, comic';

// ── 캐릭터 공통 특징 ────────────────────────────────────────────────────────────
const CREATURE =
  'a chubby chibi baby dragon, soft teal-green smooth scales, ' +
  'cream-colored smooth belly, huge round glossy eyes, tiny rounded horns, ' +
  'pudgy short round limbs. ' +
  'Same character at different growth stages. ' +
  'SINGLE character only, one pose, solo, centered in canvas. ' +
  'Style: smooth clean 2D digital illustration, flat color with soft cel shading, ' +
  'clean outlines, mobile game character art style, kawaii cute, ' +
  'white background, centered composition, full body visible';

// ── 단계별 설명 ───────────────────────────────────────────────────────────────
const STAGE_DESC = {
  egg:
    'a single cute round egg, smooth soft mint teal-green color, ' +
    'small cream-white speckles dotted on the surface, ' +
    'no face, no eyes, no cracks, no character visible. ' +
    'Slight soft drop shadow underneath. Simple clean egg shape. ' +
    'Style: smooth 2D digital illustration, flat color, soft shading, white background',

  newborn:
    'just-hatched tiny hatchling, no wings at all, ' +
    'broken eggshell pieces scattered at feet, ' +
    'head is much larger than body (chibi 1:1 ratio), ' +
    'takes up about one-third of the canvas height, ' +
    'wide surprised innocent eyes, stubby tiny tail',

  infant:
    'very small baby dragon, no wings yet, ' +
    'round chubby body, head as large as the body, ' +
    'very short stubby tail, sitting upright. ' +
    'Clearly smaller and younger than child stage',

  child:
    'small young dragon, two tiny rounded wing-bud stubs on back ' +
    '(like small soft bumps, not full wings), ' +
    'big round head, pudgy round body. ' +
    'Clearly larger than infant stage',

  adolescent:
    'young growing dragon, small but visible smooth wings on back ' +
    '(each wing about one-third body width), ' +
    'round plump body, large round head with big glossy eyes. ' +
    'Noticeably larger than child stage',

  youngAdult:
    'adult chibi dragon, smooth wings spread wide (as wide as body), ' +
    'round full body fills most of canvas, ' +
    'friendly confident pose, clearly larger than adolescent',

  elder:
    'elder chibi dragon, the largest growth stage, ' +
    'magnificent smooth wings wider than body, ' +
    'soft ornate scale markings on chest, ' +
    'warm wise gentle expression, clearly the biggest of all stages',
};

// ── 감정별 설명 ───────────────────────────────────────────────────────────────
const MOOD_DESC = {
  neutral:
    'calm gentle expression, soft resting smile, relaxed comfortable pose',

  joyful:
    'huge beaming smile, bright sparkling star-shaped gleam in both eyes, ' +
    'both tiny arms raised up in joy, rosy round blush on cheeks',

  content:
    'eyes closed in happy U-shaped crescents, warm satisfied smile, ' +
    'cozy seated pose, one paw gently resting on belly',

  lonely:
    'one large shimmering teardrop on cheek, ' +
    'eyes looking softly downward, head slightly drooped, ' +
    'colors slightly muted and cool, quietly sad expression',

  down:
    'both tiny paws pressed over face, multiple large round tears streaming, ' +
    'body hunched and curled small, deeply sobbing, ' +
    'most sorrowful expression',
};

// ── 단계별 생성할 감정 ─────────────────────────────────────────────────────────
const STAGES = ['egg', 'newborn', 'infant', 'child', 'adolescent', 'youngAdult', 'elder'];
const MOODS  = ['neutral', 'joyful', 'lonely'];

// ── 프롬프트 빌더 ─────────────────────────────────────────────────────────────
function buildPrompt(stage, mood) {
  if (stage === 'egg') {
    return STAGE_DESC.egg;
  }
  return [
    CREATURE,
    STAGE_DESC[stage],
    MOOD_DESC[mood],
  ].join(', ');
}

// ── 다운로드 ──────────────────────────────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    req.setTimeout(90000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function buildUrl(stage, mood) {
  const prompt   = encodeURIComponent(buildPrompt(stage, mood));
  const negative = encodeURIComponent(NEGATIVE);
  return (
    `https://image.pollinations.ai/prompt/${prompt}` +
    `?width=${W}&height=${H}&nologo=true&seed=${SEED}&model=flux&negative=${negative}`
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const total = STAGES.length * MOODS.length;
  let done = 0;

  console.log(`캐릭터 아트 생성 시작 — 총 ${total}장`);
  console.log(`출력 폴더: ${PREVIEW_DIR}\n`);

  for (const stage of STAGES) {
    for (const mood of MOODS) {
      done++;
      const fname = `${stage}-${mood}.png`;
      const dest  = path.join(PREVIEW_DIR, fname);
      const url   = buildUrl(stage, mood);

      process.stdout.write(`[${done}/${total}] ${fname} ... `);
      const t0 = Date.now();
      try {
        await download(url, dest);
        console.log(`완료 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      } catch (e) {
        console.log(`실패: ${e.message}`);
      }

      // 요청 간 간격 (API 부하 방지)
      if (done < total) await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n전체 완료 → ${PREVIEW_DIR}`);
  console.log('\n확인 후 src/assets/character/ 에 복사하려면:');
  console.log('  node scripts/apply-ai-art.js');
}

main().catch(e => { console.error(e); process.exit(1); });
