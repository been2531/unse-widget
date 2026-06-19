// Mythic 캐릭터 아트 생성 — 6원소 신화 등급
// 실행: node scripts/generate-mythic-chars.js
// 출력: scripts/test-output/mythic/ → 확인 후 src/assets/character/ 복사

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT_DIR = path.join(__dirname, 'test-output', 'mythic');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 512, H = 512;
const SEED = 9999;

const STYLE =
  'single character, centered, full body, white background, ' +
  'clean 2D digital illustration, flat color with soft cel shading, ' +
  'smooth clean outlines, mobile TCG card game character art style, ' +
  'vibrant saturated colors, ultra detailed, god tier artwork, divine aura';

const NEGATIVE =
  'multiple characters, human, person, realistic, photo, 3D render, ' +
  'blurry, deformed, extra limbs, watermark, text, border, frame, background scenery, ' +
  'pixel art, chibi, cute, baby';

const MYTHICS = [
  {
    id: 'fire_4', nameKo: '천화신',
    prompt:
      'Cheonhwasin, Korean god of cosmic fire, divine celestial deity, ' +
      'enormous blazing three-legged crow with galaxy wings made of supernovae, ' +
      'body radiating like a sun, each feather is a burning star, ' +
      'cosmic flames and nebula swirling around, golden divine crown, ' +
      'transcendent otherworldly presence, galaxy fire color palette, ' + STYLE,
  },
  {
    id: 'water_4', nameKo: '용왕',
    prompt:
      'Yongwang, supreme Korean Dragon King god of all oceans and time, ' +
      'colossal serpentine divine dragon with scales of deep-sea sapphire and moonlight silver, ' +
      'luminous ethereal mane flowing like ocean currents, pearl crown of divine authority, ' +
      'surrounded by swirling seas and tidal forces, godlike commanding presence, ' +
      'deep cosmic ocean color palette, ' + STYLE,
  },
  {
    id: 'lightning_4', nameKo: '뇌신',
    prompt:
      'Noesin, Korean primordial god of thunder and first lightning of creation, ' +
      'divine white tiger of storms with pure white fur crackling with golden lightning, ' +
      'storm crown of perpetual thunderbolts, eyes like lightning storms, ' +
      'aurora and plasma energy surrounding body, ' +
      'every step creates thunder, transcendent divine stance, ' +
      'electric gold and pure white cosmic color palette, ' + STYLE,
  },
  {
    id: 'nature_4', nameKo: '목신',
    prompt:
      'Moksin, Korean god of life and World Tree, ancient divine jade deer, ' +
      'enormous body of living ancient wood and blooming flowers, ' +
      'antlers that reach the sky covered in glowing cosmic flowers, ' +
      'entire forest ecosystem growing from body, ' +
      'divine emerald glow of life force radiating, ' +
      'ancient sacred world tree color palette, ' + STYLE,
  },
  {
    id: 'dark_4', nameKo: '명부왕',
    prompt:
      'Myeongbuwang, Korean god judge between life and death, divine nine-tailed fox, ' +
      'jet black fur with nine cosmic tails that contain the boundary between worlds, ' +
      'realm-splitting dark energy emanating from body, ' +
      'eyes like twin black holes, shadow crown of void, ' +
      'the space around dissolves into darkness and stars, ' +
      'cosmic void and dark matter color palette, ' + STYLE,
  },
  {
    id: 'light_4', nameKo: '태양신',
    prompt:
      'Taeyangsin, Korean primordial sun god, divine phoenix of original light, ' +
      'magnificent wings spanning the sky made of pure solar plasma, ' +
      'body radiating as bright as the first sun at universe creation, ' +
      'divine white-gold light crown, feathers are living sunbeams, ' +
      'surrounded by solar flares and divine radiance, ' +
      'transcendent pure light and sun energy, ' +
      'divine solar gold and white color palette, ' + STYLE,
  },
];

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

async function main() {
  console.log(`Mythic 캐릭터 생성 — ${MYTHICS.length}장\n`);

  for (let i = 0; i < MYTHICS.length; i++) {
    const c = MYTHICS[i];
    const dest = path.join(OUT_DIR, `${c.id}.png`);
    process.stdout.write(`[${i + 1}/${MYTHICS.length}] ${c.id} (${c.nameKo}) ... `);
    const t0 = Date.now();
    try {
      await download(buildUrl(c), dest);
      console.log(`완료 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.log(`실패: ${e.message}`);
    }
    if (i < MYTHICS.length - 1) await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n완료 → ${OUT_DIR}`);
  console.log('확인 후: node scripts/remove-bg.js mythic → src/assets/character/ 에 복사');
}

main().catch(e => { console.error(e); process.exit(1); });
