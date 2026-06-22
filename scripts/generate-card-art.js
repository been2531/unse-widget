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

  // ── 신규: 봉황 시리즈 (오색 평화 신조) ──────────────────────────────────
  {
    id: 'bonghwang_1', seed: 3001, rarity: 'common',
    prompt: 'Bongi young Korean Bonghwang phoenix hatchling of peace and virtue, ' +
      'small round chick covered in soft five-colored osaek plumage, ' +
      'delicate gold crimson azure jade white feathers just emerging, ' +
      'gentle warm glow, peaceful serene expression, sacred tree branch perch, ' +
      'Korean mythological bird of peace, ',
  },
  {
    id: 'bonghwang_2', seed: 3002, rarity: 'rare',
    prompt: 'Hwangi adolescent Korean Bonghwang phoenix growing in grace, ' +
      'elegant bird with developing five-colored osaek plumage in full bloom, ' +
      'wings beginning to spread showing multicolored feather splendor, ' +
      'gentle golden light radiating peaceful aura, sacred blossoms around, ' +
      'noble Korean peace deity bird, ',
  },
  {
    id: 'bonghwang_3', seed: 3003, rarity: 'epic',
    prompt: 'Bonghwang the supreme Korean sacred phoenix of peace and virtue, ' +
      'magnificent five-colored osaek phoenix with breathtaking plumage, ' +
      'gold crimson azure jade white feathers blazing in radiant harmony, ' +
      'wings fully spread in majestic display of celestial peace, ' +
      'sacred tree and flowering branches in background, divine peaceful gaze, ' +
      'apex Korean mythological bird of divine virtue and prosperity, ',
  },

  // ── 신규: 도깨비 시리즈 (암흑 트릭스터) ─────────────────────────────────
  {
    id: 'dokkaebi_1', seed: 3101, rarity: 'common',
    prompt: 'Dokki young Korean Dokkaebi trickster spirit, small mischievous goblin, ' +
      'tiny wild red horns, small ornate magic club Dokkaebi-bangmangi, ' +
      'tiger-pattern traditional clothes, wild hair and gap-toothed grin, ' +
      'playful dark spirit energy, small pranks and sparks, ' +
      'young Korean shamanistic goblin spirit, ',
  },
  {
    id: 'dokkaebi_2', seed: 3102, rarity: 'rare',
    prompt: 'Gwisini growing Korean Dokkaebi supernatural trickster, ' +
      'powerful goblin with large wild red horns and fierce expression, ' +
      'wielding ornate magic club crackling with star burst energy, ' +
      'tiger and leopard pattern haori robe, dark spirit smoke swirling, ' +
      'intermediate Dokkaebi power growing, wild chaotic presence, ',
  },
  {
    id: 'dokkaebi_3', seed: 3103, rarity: 'epic',
    prompt: 'Dokkaebi the great Korean supernatural trickster of ancient folklore, ' +
      'immensely powerful wild goblin with enormous blazing red horns, ' +
      'massive ornate Dokkaebi-bangmangi club erupting with star magic, ' +
      'ancient tiger-pattern ceremonial garb, wild untamed spirit aura, ' +
      'dark energy and mischievous lightning surrounding mighty form, ' +
      'apex Korean mythological trickster and chaos spirit, ',
  },

  // ── 신규: 해태 시리즈 (정의 수호 사자) ──────────────────────────────────
  {
    id: 'haetae_1', seed: 3201, rarity: 'common',
    prompt: 'Haei young Haetae justice guardian lion of Korean mythology, ' +
      'small lion-like creature with single straight horn on forehead, ' +
      'compact sturdy body covered in white and silver fur, ' +
      'gentle but watchful eyes of justice, soft flame-scale markings, ' +
      'young Korean divine justice guardian awakening, ',
  },
  {
    id: 'haetae_2', seed: 3202, rarity: 'rare',
    prompt: 'Taetae adult Haetae Korean justice guardian growing in power, ' +
      'proud lion-like creature with prominent single horn gleaming, ' +
      'silver-white scaled fur with blue fire markings, powerful build, ' +
      'scales that absorb and judge evil energy, noble guardian stance, ' +
      'divine justice aura radiating outward, Korean law guardian spirit, ',
  },
  {
    id: 'haetae_3', seed: 3203, rarity: 'epic',
    prompt: 'Haetae the supreme Korean divine guardian of law and justice, ' +
      'majestic powerful lion with magnificent single celestial horn blazing, ' +
      'radiant silver-white body covered in divine protective scales, ' +
      'blazing blue-white justice fire erupting from horn and body, ' +
      'supreme protector that punishes evil and guards the righteous, ' +
      'overwhelming divine guardian presence of ancient Korean justice, ',
  },

  // ── 신규: 청룡 시리즈 (동방 수호 청룡) ──────────────────────────────────
  {
    id: 'cheongnyong_1', seed: 3301, rarity: 'common',
    prompt: 'Cheongi young Cheongnyong azure dragon of Korean eastern guardian mythology, ' +
      'small young dragon with bright azure blue-green scales and tiny horns, ' +
      'slender serpentine body coiled gracefully, wood element energy, ' +
      'spring wind and cherry blossoms around young form, ' +
      'guardian of the east awakening, Korean four divine beasts, ',
  },
  {
    id: 'cheongnyong_2', seed: 3302, rarity: 'rare',
    prompt: 'Nyongi adolescent Cheongnyong azure dragon growing in power, ' +
      'elegant dragon with deep azure and teal scales in full development, ' +
      'spiraling body with growing wood-spirit energy, spring storm forming, ' +
      'eastern wind and young tree energy swirling around form, ' +
      'Korean eastern guardian dragon growing in celestial power, ',
  },
  {
    id: 'cheongnyong_3', seed: 3303, rarity: 'epic',
    prompt: 'Cheongnyong the supreme azure dragon guardian of the Korean east, ' +
      'magnificent dragon with resplendent deep azure celestial scales, ' +
      'immense coiling form commanding eastern winds and spring energy, ' +
      'wood element power erupting, spring thunder and forest energy, ' +
      'one of the four divine beasts protecting Korean cosmos, ' +
      'supreme eastern guardian radiating azure divine light, ',
  },

  // ── 신규: 백호 시리즈 (서방 수호 백호) ──────────────────────────────────
  {
    id: 'baekho_1', seed: 3401, rarity: 'common',
    prompt: 'Baeigi young Baekho white tiger guardian of Korean western mythology, ' +
      'small pure white tiger cub with distinctive black tiger stripes, ' +
      'metal element energy faintly glowing silver-white, ' +
      'autumn leaves and cool wind around young form, ' +
      'western guardian tiger cub awakening in Korean cosmology, ',
  },
  {
    id: 'baekho_2', seed: 3402, rarity: 'rare',
    prompt: 'Hoigi adolescent Baekho white tiger growing in power, ' +
      'sleek white tiger with bold black stripes and silver metal aura, ' +
      'powerful growing form in dynamic hunting stance, ' +
      'autumn wind and metal energy crackling around form, ' +
      'Korean western guardian growing in divine predator power, ',
  },
  {
    id: 'baekho_3', seed: 3403, rarity: 'epic',
    prompt: 'Baekho the supreme white tiger guardian of the Korean west, ' +
      'magnificent pure white tiger with blazing black stripes, ' +
      'immense powerful body emanating silver-white metal divine energy, ' +
      'autumn storm and metal lightning erupting around apex predator form, ' +
      'one of the four divine beasts of Korean celestial guardianship, ' +
      'supreme western guardian with overwhelming divine metal energy, ',
  },

  // ── 신규: 현무 시리즈 (북방 수호 현무) ──────────────────────────────────
  {
    id: 'hyeonmu_1', seed: 3501, rarity: 'common',
    prompt: 'Hyeoni young Hyeonmu black tortoise-serpent of Korean northern guardian, ' +
      'small turtle with intertwined serpent companion, dark blue-black coloring, ' +
      'water element and earth energy in nascent form, ' +
      'winter cold and deep water mist around small form, ' +
      'northern guardian awakening in Korean four divine beast cosmology, ',
  },
  {
    id: 'hyeonmu_2', seed: 3502, rarity: 'rare',
    prompt: 'Mui adolescent Hyeonmu black warrior tortoise-serpent growing in power, ' +
      'sturdy dark turtle with powerful serpent coiling around shell, ' +
      'deep blue-black water and earth energy developing, ' +
      'winter deep water and ancient stone energy emanating, ' +
      'Korean northern guardian growing in primordial power, ',
  },
  {
    id: 'hyeonmu_3', seed: 3503, rarity: 'epic',
    prompt: 'Hyeonmu the supreme black tortoise-serpent guardian of the Korean north, ' +
      'ancient massive dark turtle with great serpent entwined around its shell, ' +
      'deep black-blue water and earth divine energy erupting, ' +
      'winter storm and deep ocean abyss power around immovable form, ' +
      'one of the four divine beasts of Korean celestial guardianship, ' +
      'supreme northern guardian of ancient wisdom and endurance, ',
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
