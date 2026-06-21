// 카드 캐릭터 아트 생성 — Pollinations.ai Flux
// 교체 필수 + 스타일 보완 + 신규 생성 (TASKS.md 참고)
// 실행: node scripts/generate-card-art.js
// 출력: scripts/test-output/cards/

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT_DIR = path.join(__dirname, 'test-output', 'cards');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 512, H = 512;

const STYLE =
  'cute chibi 2D digital illustration, Korean mythology inspired, ' +
  'soft cel shading, clean outlines, mobile game character art style, ' +
  'kawaii cute, white background, centered composition, full body visible, ' +
  'single character, solo, no text, no border';

const NEGATIVE =
  'pixel art, pixelated, 8-bit, blurry, ugly, deformed, extra limbs, ' +
  'watermark, text, border, frame, realistic, photo, human face, ' +
  'multiple characters, reference sheet, collage, grid, panel, chinese style';

const CARDS = [
  // ── 교체 필수 ──────────────────────────────────────────────────────────────
  {
    id: 'lightning_1', seed: 1001,
    prompt: 'tiny cute chibi Korean thunder god infant, chubby baby deity, ' +
      'golden lightning bolt markings on skin, floating in air, ' +
      'holding a small traditional drum (buk), electrified fluffy hair, ' +
      'sparkling golden aura around body, ' + STYLE,
  },
  {
    id: 'nature_3', seed: 1003,
    prompt: 'cute chibi Korean mountain spirit (sansin), gentle elderly figure, ' +
      'white joseon hanbok robe, long flowing white beard, ' +
      'wooden walking staff with pine tree motif, ' +
      'small cute white tiger sitting beside, soft green mountain mist, ' + STYLE,
  },
  {
    id: 'nature_4', seed: 1004,
    prompt: 'cute chibi Dangun founder of Gojoseon, ancient Korean divine figure, ' +
      'wearing ceremonial bronze age ritual robes with bear and tiger motifs, ' +
      'holding celestial three treasures (cheonbuин), ' +
      'golden divine crown, radiant holy aura, ' + STYLE,
  },
  {
    id: 'light_4', seed: 2004,
    prompt: 'cute chibi Hwanin supreme sky god of Korean mythology, ' +
      'radiant golden divine aura, wearing ancient Korean celestial robes, ' +
      'holding three heavenly seals (cheonbu-in) glowing with light, ' +
      'heavenly clouds and stars surrounding, majestic yet cute, ' + STYLE,
  },
  {
    id: 'fire_4', seed: 3004,
    prompt: 'cute chibi Korean sun bird taeyangsinjo, ' +
      'magnificent five-colored (오색) brilliant plumage, ' +
      'gold red blue green white rainbow feathers, ' +
      'tiny beak, glowing sun rays radiating around body, ' +
      'sitting proud on a cloud with sunbeams, ' + STYLE,
  },

  // ── 스타일 보완 ─────────────────────────────────────────────────────────────
  {
    id: 'fire_1', seed: 3001,
    prompt: 'cute chibi Korean phoenix chick bong-a, ' +
      'baby phoenix with fluffy five-colored (오색) feathers, ' +
      'gold red blue green white tiny downy feathers, ' +
      'oversized round head, tiny beak open in surprise, ' +
      'small wing-buds, round chubby body, ' + STYLE,
  },
  {
    id: 'water_1', seed: 4001,
    prompt: 'cute chibi Korean imugi water serpent, ' +
      'long sinuous serpent body coiled gently, small dragon-like head, ' +
      'blue-green iridescent scales, tiny claws, ' +
      'water droplets sparkling around body, ' +
      'dreamy expression gazing upward at sky, longing to become a dragon, ' + STYLE,
  },
  {
    id: 'dark_1', seed: 5001,
    prompt: 'cute chibi Korean dokkaebi goblin, ' +
      'small round body, two tiny red horns on head, ' +
      'holding a star-covered magic club (도깨비방망이), ' +
      'mischievous grin showing one fang, ' +
      'traditional Korean tiger-skin shorts, wild spiky hair, ' + STYLE,
  },

  // ── 신규: 구미호 시리즈 (fire) ─────────────────────────────────────────────
  {
    id: 'gumiho_1', seed: 6001,
    prompt: 'cute chibi Korean baby fox miho, ' +
      'tiny round fox pup with one fluffy tail, ' +
      'large curious innocent eyes, orange-gold fur, small perky ears, ' +
      'sitting upright, playful innocent expression, very young and small, ' + STYLE,
  },
  {
    id: 'gumiho_2', seed: 6002,
    prompt: 'cute chibi Korean three-tailed fox yeowoo, ' +
      'young fox with three beautiful fluffy tails fanned out, ' +
      'slightly larger than baby stage, clever playful expression, ' +
      'orange fur with white tail tips, glowing amber eyes, ' +
      'learning to speak, confident pose, ' + STYLE,
  },
  {
    id: 'gumiho_3', seed: 6003,
    prompt: 'cute chibi Korean legendary nine-tailed fox gumiho, ' +
      'nine magnificent fluffy golden tails spread wide, ' +
      'mystical golden glowing eyes, elegant and powerful, ' +
      'silver-white and gold fur, ethereal magic sparkles around, ' +
      'mesmerizing otherworldly beauty even in chibi form, ' + STYLE,
  },

  // ── 신규: 이무기 시리즈 (water) ────────────────────────────────────────────
  {
    id: 'imugi_1', seed: 7001,
    prompt: 'cute chibi tiny baby imugi Korean water serpent imi, ' +
      'very small serpent curled up sleeping, ' +
      'light blue-green soft scales, round sleepy face, ' +
      'small water bubbles around, resting on river pebbles, ' +
      'peaceful innocent expression, smallest stage, ' + STYLE,
  },
  {
    id: 'imugi_2', seed: 7002,
    prompt: 'cute chibi growing imugi Korean water serpent suri, ' +
      'medium-sized serpent with longer body coiled, ' +
      'teal and indigo shimmering scales, ' +
      'stretching upright proudly, light rain and waves swirling around, ' +
      'beginning to show power, determined expression, ' + STYLE,
  },
  {
    id: 'imugi_3', seed: 7003,
    prompt: 'cute chibi powerful imugi almost-dragon Korean water serpent, ' +
      'large serpent with pearl in mouth (여의주), ' +
      'deep blue-violet iridescent scales, small proto-dragon horns, ' +
      'thunderstorm clouds and lightning around, ' +
      'gazing skyward ready to ascend and become a dragon, dramatic aura, ' + STYLE,
  },

  // ── 신규: 삼족오 시리즈 (lightning) ───────────────────────────────────────
  {
    id: 'samjogo_1', seed: 8001,
    prompt: 'cute chibi baby three-legged bird samjogo chick sammi, ' +
      'tiny fluffy black bird chick with three small legs visible, ' +
      'oversized round head, bright golden eyes, ' +
      'small sun disc behind body, baby down feathers, ' +
      'wobbly standing on three legs, very young adorable, ' + STYLE,
  },
  {
    id: 'samjogo_2', seed: 8002,
    prompt: 'cute chibi three-legged sun bird haejo samjogo, ' +
      'grown bird with black feathers and gold markings, three legs clearly shown, ' +
      'wings spread with lightning crackling between feathers, ' +
      'bright sun halo behind, confident flying pose, ' +
      'sparks and electricity around wingtips, ' + STYLE,
  },
  {
    id: 'samjogo_3', seed: 8003,
    prompt: 'cute chibi legendary three-legged crow samjogo in the sun, ' +
      'majestic black bird with three legs, golden solar disc surrounding body, ' +
      'brilliant sun rays and lightning bolts radiating, ' +
      'most powerful form, ancient cosmic bird of Korean mythology, ' +
      'divine golden and black contrast, legendary aura, ' + STYLE,
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

function buildUrl(card) {
  const prompt   = encodeURIComponent(card.prompt);
  const negative = encodeURIComponent(NEGATIVE);
  return (
    `https://image.pollinations.ai/prompt/${prompt}` +
    `?width=${W}&height=${H}&nologo=true&seed=${card.seed}&model=flux&negative=${negative}`
  );
}

async function main() {
  console.log(`카드 아트 생성 시작 — 총 ${CARDS.length}장`);
  console.log(`출력: ${OUT_DIR}\n`);

  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const fname = `${card.id}.png`;
    const dest  = path.join(OUT_DIR, fname);
    const url   = buildUrl(card);

    process.stdout.write(`[${i + 1}/${CARDS.length}] ${fname} ... `);
    const t0 = Date.now();
    try {
      await download(url, dest);
      console.log(`완료 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.log(`실패: ${e.message}`);
    }

    if (i < CARDS.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n전체 완료 → ${OUT_DIR}`);
  console.log('\n다음 단계:');
  console.log('  node scripts/apply-card-art.js   (흰 배경 제거 + assets 복사)');
}

main().catch(e => { console.error(e); process.exit(1); });
