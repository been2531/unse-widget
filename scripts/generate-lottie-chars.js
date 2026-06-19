// 치비 드래곤 Lottie JSON 생성 — neutral / joyful / lonely
// 실행: node scripts/generate-lottie-chars.js
// 출력: src/assets/lottie/{neutral,joyful,lonely}.json

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../src/assets/lottie');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ── 색상 ──────────────────────────────────────────────────────────────────────
const C = {
  teal:  [0.20, 0.65, 0.58, 1],  // #33A694 몸통
  cream: [1.00, 0.94, 0.84, 1],  // #FFF0D6 배
  dark:  [0.10, 0.10, 0.12, 1],  // #1A1A1E 눈동자
  white: [1.00, 1.00, 1.00, 1],
  pink:  [1.00, 0.70, 0.70, 1],  // 볼터치
  tear:  [0.45, 0.70, 0.95, 1],  // #73B3F2 눈물
};

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────
const s = (v) => ({ a: 0, k: v });                  // static
const a = (k) => ({ a: 1, k });                     // animated

function kf(t, val, eIn = [0.5], eOut = [0.5]) {
  return { i: { x: eIn, y: [1] }, o: { x: eOut, y: [0] }, t, s: val };
}
const kfEnd = (t, val) => ({ t, s: val });

// ── 레이어 빌더 ───────────────────────────────────────────────────────────────
let _ind = 0;
function resetInd() { _ind = 0; }

function layer(nm, cx, cy, shapes, ks = {}) {
  _ind++;
  return {
    ddd: 0, ind: _ind, ty: 4, nm, sr: 1, ao: 0, bm: 0,
    ip: 0, op: 90, st: 0,
    ks: {
      o: s(100), r: s(ks.r ?? 0),
      p: s([cx, cy, 0]),
      a: s([0, 0, 0]),
      s: ks.s ?? s([100, 100, 100]),
      ...(ks.p_anim ? { p: ks.p_anim } : {}),
    },
    shapes,
  };
}

function ellipse(w, h, color, stroke) {
  const sh = [
    { ty: 'el', nm: 'e', d: 1, p: s([0, 0]), s: s([w, h]) },
    { ty: 'fl', nm: 'f', c: s(color), o: s(100), r: 1 },
  ];
  if (stroke) sh.push({ ty: 'st', nm: 'st', c: s(stroke.c), o: s(100), w: s(stroke.w), lc: 2, lj: 2 });
  return sh;
}

function rect(w, h, r, color) {
  return [
    { ty: 'rc', nm: 'r', d: 1, p: s([0, 0]), s: s([w, h]), r: s(r) },
    { ty: 'fl', nm: 'f', c: s(color), o: s(100), r: 1 },
  ];
}

// 눈 레이어 (blink via scaleY)
function eyeLayer(nm, cx, cy, blinkKfs) {
  _ind++;
  return {
    ddd: 0, ind: _ind, ty: 4, nm, sr: 1, ao: 0, bm: 0,
    ip: 0, op: 90, st: 0,
    ks: {
      o: s(100), r: s(0),
      p: s([cx, cy, 0]),
      a: s([0, 0, 0]),
      s: a(blinkKfs),
    },
    shapes: ellipse(14, 14, C.dark),
  };
}

function highlight(cx, cy) {
  return layer('hl', cx, cy, ellipse(5, 5, C.white));
}

// ── 깜빡임 키프레임 ───────────────────────────────────────────────────────────
// 90프레임 중 70~72프레임에서 깜빡임
function blinkKfs(delay = 70) {
  return [
    kf(0,  [100, 100, 100]),
    kf(delay,   [100, 100, 100]),
    kf(delay+1, [100, 5,   100]),
    kf(delay+2, [100, 100, 100]),
    kfEnd(90,   [100, 100, 100]),
  ];
}

// ── neutral.json ─────────────────────────────────────────────────────────────
function makeNeutral() {
  resetInd();
  const breathKfs = [
    kf(0,  [100, 100, 100]),
    kf(45, [103, 103, 100]),
    kfEnd(90, [100, 100, 100]),
  ];
  return {
    v: '5.7.4', fr: 30, ip: 0, op: 90, w: 200, h: 200,
    nm: 'neutral', ddd: 0, assets: [],
    layers: [
      // 꼬리 (body 뒤)
      layer('tail', 148, 148, [
        {
          ty: 'sh', nm: 'path', d: 1,
          ks: s({ i: [[0,0],[0,0],[0,0],[0,0]], o: [[0,0],[0,0],[0,0],[0,0]],
            v: [[0,0],[20,-10],[30,10],[10,20]], c: false }),
        },
        { ty: 'st', nm: 'st', c: s(C.teal), o: s(100), w: s(10), lc: 2, lj: 2 },
      ], { r: 0, s: a([kf(0,[100,100,100]), kf(45,[105,95,100]), kfEnd(90,[100,100,100])]) }),

      // 몸통 (breathing)
      { ...layer('body', 100, 128, ellipse(82, 72, C.teal), { s: a(breathKfs) }), ind: _ind },
      // 배
      layer('belly', 100, 135, ellipse(44, 34, C.cream)),
      // 왼팔
      layer('larm', 58, 122, rect(14, 28, 7, C.teal), { r: -15 }),
      // 오른팔
      layer('rarm', 142, 122, rect(14, 28, 7, C.teal), { r: 15 }),
      // 머리 (breathing 같이)
      { ...layer('head', 100, 76, ellipse(68, 66, C.teal), { s: a(breathKfs) }), ind: _ind },
      // 왼쪽 볼
      layer('lblush', 82, 86, ellipse(14, 9, C.pink)),
      // 오른쪽 볼
      layer('rblush', 118, 86, ellipse(14, 9, C.pink)),
      // 입 (작은 미소 — 생략, 눈으로 표현)
      // 왼눈
      eyeLayer('leye', 86, 72, blinkKfs(70)),
      highlight(90, 68),
      eyeLayer('reye', 114, 72, blinkKfs(70)),
      highlight(118, 68),
      // 왼뿔
      layer('lhorn', 88, 47, rect(8, 14, 2, C.teal), { r: -10 }),
      // 오른뿔
      layer('rhorn', 112, 47, rect(8, 14, 2, C.teal), { r: 10 }),
    ],
  };
}

// ── joyful.json ───────────────────────────────────────────────────────────────
function makeJoyful() {
  resetInd();
  // 위아래 바운스 (60프레임 루프)
  const bounceKfs = [
    kf(0,  [100, 130, 0]),
    kf(15, [100, 118, 0], [0.33], [0.67]),
    kf(30, [100, 130, 0]),
    kfEnd(60, [100, 130, 0]),
  ];
  // 양팔 들기
  const larmKfs = [kf(0,[100,100,100]), kf(15,[100,100,100]), kfEnd(60,[100,100,100])];

  return {
    v: '5.7.4', fr: 30, ip: 0, op: 60, w: 200, h: 200,
    nm: 'joyful', ddd: 0, assets: [],
    layers: [
      layer('tail', 148, 148, [
        { ty: 'sh', nm: 'path', d: 1,
          ks: s({ i:[[0,0],[0,0],[0,0],[0,0]], o:[[0,0],[0,0],[0,0],[0,0]],
            v:[[0,0],[20,-15],[35,5],[12,18]], c: false }) },
        { ty: 'st', nm: 'st', c: s(C.teal), o: s(100), w: s(10), lc: 2, lj: 2 },
      ]),
      // 몸통 — 바운스
      (() => {
        const l = layer('body', 0, 0, ellipse(82, 72, C.teal));
        l.ks.p = a(bounceKfs);
        l.ks.s = s([100, 100, 100]);
        l.op = 60;
        return l;
      })(),
      (() => {
        const l = layer('belly', 0, 0, ellipse(44, 34, C.cream));
        l.ks.p = a([
          kf(0,[100,137,0]), kf(15,[100,125,0]), kf(30,[100,137,0]), kfEnd(60,[100,137,0]),
        ]);
        l.op = 60;
        return l;
      })(),
      // 왼팔 들기
      (() => {
        const l = layer('larm', 55, 108, rect(14, 28, 7, C.teal), { r: -50 });
        l.op = 60;
        return l;
      })(),
      // 오른팔 들기
      (() => {
        const l = layer('rarm', 145, 108, rect(14, 28, 7, C.teal), { r: 50 });
        l.op = 60;
        return l;
      })(),
      // 머리
      (() => {
        const l = layer('head', 0, 0, ellipse(68, 66, C.teal));
        l.ks.p = a([
          kf(0,[100,76,0]), kf(15,[100,64,0]), kf(30,[100,76,0]), kfEnd(60,[100,76,0]),
        ]);
        l.op = 60;
        return l;
      })(),
      (() => { const l = layer('lblush',82,86,ellipse(14,9,C.pink)); l.op=60; return l; })(),
      (() => { const l = layer('rblush',118,86,ellipse(14,9,C.pink)); l.op=60; return l; })(),
      // 눈 — 기쁠 때 더 크게
      (() => { const l = eyeLayer('leye',86,72,blinkKfs(50)); l.op=60; return l; })(),
      (() => { const l = highlight(90,68); l.op=60; return l; })(),
      (() => { const l = eyeLayer('reye',114,72,blinkKfs(50)); l.op=60; return l; })(),
      (() => { const l = highlight(118,68); l.op=60; return l; })(),
      (() => { const l = layer('lhorn',88,47,rect(8,14,2,C.teal),{r:-10}); l.op=60; return l; })(),
      (() => { const l = layer('rhorn',112,47,rect(8,14,2,C.teal),{r:10}); l.op=60; return l; })(),
    ],
  };
}

// ── lonely.json ───────────────────────────────────────────────────────────────
function makeLonely() {
  resetInd();
  // 느리게 흔들림
  const droopKfs = [
    kf(0,  [100, 100, 100]),
    kf(60, [100, 102, 100]),
    kfEnd(90, [100, 100, 100]),
  ];
  // 눈물 — 아래로 떨어짐
  const tearKfs = [
    kf(0,  [100, 72, 0]),
    kf(45, [102, 92, 0]),
    kf(60, [102, 112, 0]),
    kfEnd(90, [102, 72, 0]),
  ];
  const tearOpKfs = [
    kf(0,  [100]),
    kf(50, [100]),
    kf(60, [0]),
    kfEnd(90, [0]),
  ];

  return {
    v: '5.7.4', fr: 30, ip: 0, op: 90, w: 200, h: 200,
    nm: 'lonely', ddd: 0, assets: [],
    layers: [
      layer('tail', 148, 148, [
        { ty: 'sh', nm: 'path', d: 1,
          ks: s({ i:[[0,0],[0,0],[0,0],[0,0]], o:[[0,0],[0,0],[0,0],[0,0]],
            v:[[0,0],[10,-5],[18,8],[5,16]], c: false }) },
        { ty: 'st', nm: 'st', c: s(C.teal), o: s(100), w: s(10), lc: 2, lj: 2 },
      ]),
      layer('body', 100, 128, ellipse(82, 72, C.teal), { s: a(droopKfs) }),
      layer('belly', 100, 135, ellipse(44, 34, C.cream)),
      layer('larm', 58, 125, rect(14, 28, 7, C.teal), { r: -5 }),
      layer('rarm', 142, 125, rect(14, 28, 7, C.teal), { r: 5 }),
      layer('head', 100, 78, ellipse(68, 66, C.teal), { r: -5 }),
      // 눈물
      (() => {
        _ind++;
        return {
          ddd: 0, ind: _ind, ty: 4, nm: 'tear', sr: 1, ao: 0, bm: 0,
          ip: 0, op: 90, st: 0,
          ks: {
            o: a([kf(0,[100]),kf(50,[100]),kf(60,[0]),kfEnd(90,[0])]),
            r: s(0), p: a(tearKfs), a: s([0,0,0]), s: s([100,100,100]),
          },
          shapes: [
            { ty: 'sh', nm: 'drop', d: 1,
              ks: s({ i:[[0,0],[0.55,0],[0,-0.55],[0,0]], o:[[0,0],[0,0.55],[0.55,0],[0,0]],
                v:[[0,-7],[6,1],[0,7],[-6,1]], c: true }) },
            { ty: 'fl', nm: 'f', c: s(C.tear), o: s(100), r: 1 },
          ],
        };
      })(),
      eyeLayer('leye', 86, 74, blinkKfs(80)),
      highlight(90, 70),
      eyeLayer('reye', 114, 74, blinkKfs(80)),
      highlight(118, 70),
      layer('lhorn', 88, 47, rect(8, 14, 2, C.teal), { r: -10 }),
      layer('rhorn', 112, 47, rect(8, 14, 2, C.teal), { r: 10 }),
    ],
  };
}

// ── 출력 ──────────────────────────────────────────────────────────────────────
const files = { neutral: makeNeutral(), joyful: makeJoyful(), lonely: makeLonely() };
for (const [name, data] of Object.entries(files)) {
  const dest = path.join(OUT, `${name}.json`);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2));
  console.log(`생성: ${name}.json (${(fs.statSync(dest).size / 1024).toFixed(1)}KB)`);
}
console.log('완료 →', OUT);
