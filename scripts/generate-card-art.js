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

// 공통 스타일: 한국신화 판타지 디지털 아트, CCG 카드 일러스트 스타일
const STYLE =
  'Korean mythology fantasy digital art, detailed CCG card illustration style, ' +
  'dramatic lighting, ethereal spirit energy, dark atmospheric background, ' +
  'glowing magical aura, painterly fine art, mystical and powerful presence, ' +
  'single creature centered, full body visible, white background, ' +
  'professional mobile card game art, no text, no border, no frame';

const NEGATIVE =
  'chibi, kawaii, cute, cartoon, anime, pixel art, pixelated, ' +
  'blurry, ugly, deformed, extra limbs, watermark, text, border, ' +
  'western fantasy, european, chinese deity, japanese anime style, ' +
  'multiple characters, reference sheet, collage, grid, panel, ' +
  'realistic photo, human portrait, childish, adorable';

const CARDS = [
  // ── 교체 필수 ──────────────────────────────────────────────────────────────
  {
    id: 'lightning_1', seed: 2101,
    prompt: 'Cheonbung thunder spirit of Korean mythology, infant storm deity, ' +
      'swirling golden lightning crackling around small ethereal body, ' +
      'ancient Korean shamanic aesthetic, electric blue-gold energy vortex, ' +
      'glowing storm eyes, traditional buk drum floating nearby, ' +
      'dark thundercloud atmosphere, powerful despite small form, ' + STYLE,
  },
  {
    id: 'nature_3', seed: 2103,
    prompt: 'Sansin Korean mountain god spirit of ancient Korea, ' +
      'venerable elder deity in white joseon hanbok ceremonial robes, ' +
      'long silver beard flowing with mountain mist, ' +
      'white tiger companion crouching beside, pine forest spirit energy, ' +
      'emerald green mountain aura, ancient divine authority, ' +
      'misty mountain peaks in background, ' + STYLE,
  },
  {
    id: 'nature_4', seed: 2104,
    prompt: 'Dangun Wanggeom founder deity of ancient Gojoseon Korea, ' +
      'powerful divine figure in bronze-age ceremonial ritual robes, ' +
      'bear and tiger totems flanking, sacred sandalwood tree Sindan behind, ' +
      'holding three celestial treasures Cheonbu-in glowing with divine light, ' +
      'golden cosmic aura, primordial Korean creation deity energy, ' + STYLE,
  },
  {
    id: 'light_4', seed: 2204,
    prompt: 'Hwanin supreme sky god of Korean cosmology, ' +
      'transcendent celestial deity radiating blinding golden-white light, ' +
      'wearing ancient Korean heavenly divine robes with cloud patterns, ' +
      'holding three glowing sacred objects Cheonbu-in, ' +
      'vast cosmic void and stars behind, absolute divine authority, ' +
      'rays of pure light emanating from body, ' + STYLE,
  },
  {
    id: 'fire_4', seed: 2304,
    prompt: 'Taeyangsinjo the great sun bird of Korean mythology, ' +
      'magnificent divine bird with blazing five-colored sacred plumage, ' +
      'osaek gold crimson azure white jade feathers radiating solar fire, ' +
      'wings fully spread wide catching sunlight, flames and sunbeams around, ' +
      'ancient Korean solar deity symbolism, ' + STYLE,
  },

  // ── 스타일 보완 ─────────────────────────────────────────────────────────────
  {
    id: 'fire_1', seed: 2301,
    prompt: 'Bonga young Korean phoenix hatchling, ' +
      'sacred osaek five-colored phoenix chick with vivid gold crimson azure jade plumage, ' +
      'small but radiating fierce solar fire energy, ' +
      'Korean traditional ornamental feather patterns, glowing ember eyes, ' +
      'surrounded by sacred flames and sparks, intense mythological presence, ' + STYLE,
  },
  {
    id: 'water_1', seed: 2401,
    prompt: 'Imugi young Korean water serpent dragon-to-be, ' +
      'long serpentine body with iridescent blue-green mystical scales, ' +
      'gazing skyward with profound longing to become a true dragon, ' +
      'swirling river mist and water spirits around body, ' +
      'pearl of wisdom Yeouiju glowing nearby, ancient Korean river spirit, ' + STYLE,
  },
  {
    id: 'dark_1', seed: 2501,
    prompt: 'Dokkaebi trickster spirit of Korean folklore, ' +
      'powerful supernatural being with two wild red horns, ' +
      'brandishing ornate magic club Dokkaebi-bangmangi with star bursts, ' +
      'wearing traditional Korean tiger-pattern haori, wild hair and fierce grin, ' +
      'swirling dark energy and mischief spirits around, ' +
      'ancient Korean shamanistic night spirit, ' + STYLE,
  },

  // ── 신규: 구미호 시리즈 ────────────────────────────────────────────────────
  {
    id: 'gumiho_1', seed: 2601,
    prompt: 'Miho young one-tailed fox spirit of Korean mythology, ' +
      'elegant young fox with lustrous amber-gold fur and one beautiful tail, ' +
      'curious sharp intelligent eyes glowing with nascent magic, ' +
      'ethereal forest spirit energy swirling lightly, ' +
      'ancient Korean folk spirit aesthetic, mystical and charming, ' + STYLE,
  },
  {
    id: 'gumiho_2', seed: 2602,
    prompt: 'Yeowoo three-tailed fox spirit growing in power, ' +
      'sleek fox with three magnificent tails fanned in display, ' +
      'shapeshifting aura of illusion magic around body, ' +
      'silver-gold fur with magical shimmer, cunning amber eyes, ' +
      'ancient Korean supernatural yokai presence, ' + STYLE,
  },
  {
    id: 'gumiho_3', seed: 2603,
    prompt: 'Gumiho legendary nine-tailed fox of Korean mythology, ' +
      'breathtaking supernatural fox with nine radiant golden tails fanned wide, ' +
      'mesmerizing glowing golden fox eyes holding centuries of mystery, ' +
      'ethereal silver-white and gold spirit body, ' +
      'swirling reality-bending illusion magic and moonlight energy, ' +
      'apex supernatural being of Korean mythology, ' + STYLE,
  },

  // ── 신규: 이무기 시리즈 ────────────────────────────────────────────────────
  {
    id: 'imugi_1', seed: 2701,
    prompt: 'Imi young imugi water serpent of Korean rivers, ' +
      'young sinuous water serpent with soft blue-teal scales, ' +
      'resting in mountain stream with gentle water energy, ' +
      'small but mystical presence, water droplets and river mist, ' +
      'ancient Korean water spirit beginning its long journey, ' + STYLE,
  },
  {
    id: 'imugi_2', seed: 2702,
    prompt: 'Suri growing imugi serpent gaining power, ' +
      'large serpent body with deep indigo-blue iridescent scales, ' +
      'commanding the storm and deep waters, body coiled powerfully, ' +
      'swirling tempest waters and rain around, intense focused gaze, ' +
      'ancient Korean river dragon spirit approaching ascension, ' + STYLE,
  },
  {
    id: 'imugi_3', seed: 2703,
    prompt: 'Imugi the almost-dragon Korean water serpent, ' +
      'enormous majestic serpent with deep violet-blue dragon-like scales, ' +
      'holding luminous Yeouiju pearl of dragon ascension, ' +
      'massive storm clouds and lightning surrounding powerful body, ' +
      'proto-dragon horns beginning to form, eyes burning with ancient ambition, ' +
      'about to ascend to become a true Korean dragon, ' + STYLE,
  },

  // ── 신규: 삼족오 시리즈 ────────────────────────────────────────────────────
  {
    id: 'samjogo_1', seed: 2801,
    prompt: 'Sammi young Samjogo three-legged sun crow of Korean mythology, ' +
      'young three-legged black bird with distinctly visible three legs, ' +
      'small golden solar disc halo, emerging solar flame feathers, ' +
      'ancient Korean solar symbol aesthetic, curious eyes watching the sun, ' + STYLE,
  },
  {
    id: 'samjogo_2', seed: 2802,
    prompt: 'Haejo adult Samjogo three-legged sun bird in full power, ' +
      'black feathered bird with three powerful legs fully visible, ' +
      'golden sun disc radiating behind spread wings, ' +
      'lightning crackling between primary feathers on wingtips, ' +
      'living inside the Korean sun, ancient celestial messenger, ' + STYLE,
  },
  {
    id: 'samjogo_3', seed: 2803,
    prompt: 'Samjogo legendary three-legged sun crow of Korean ancient cosmology, ' +
      'magnificent black bird with three sacred legs, ' +
      'blazing solar disc crown of overwhelming golden fire, ' +
      'ancient cosmic bird deity living within the heart of the Korean sun, ' +
      'black feathers rimmed in solar gold, supreme celestial divine bird, ' + STYLE,
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
