// 캐릭터 스프라이트 생성 v2
// 64×64 논리 그리드, 5단계 쉐이딩, chibi 민트 드래곤
// 실행: node scripts/generate-character-art.js
const path = require('path');
const Jimp = require('jimp-compact');

const LOGICAL = 64;
const SCALE   = 4;
const CANVAS  = LOGICAL * SCALE; // 256px

const CHARACTER_DIR = path.join(__dirname, '../src/assets/character');

// ── 색상 헬퍼 ────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)];
}
function lerp(a,b,t) { return a + (b-a)*t; }
function brighten([r,g,b],t) { return [lerp(r,255,t),lerp(g,255,t),lerp(b,255,t)]; }
function darken([r,g,b],t)   { return [lerp(r,0,t),lerp(g,0,t),lerp(b,0,t)]; }
function desaturate([r,g,b],t) {
  const gray = 0.3*r + 0.59*g + 0.11*b;
  return [lerp(r,gray,t),lerp(g,gray,t),lerp(b,gray,t)];
}

// ── 팔레트 ───────────────────────────────────────────────────────────────────
const BASE_BODY   = hexToRgb('#8ECBA6'); // 민트 그린
const BASE_BELLY  = hexToRgb('#E6EBDA'); // 크림
const BASE_WING   = hexToRgb('#68B48A'); // 진한 민트
const OUTLINE_COL = hexToRgb('#2A4035');
const FACE_COL    = hexToRgb('#2A4035');
const TEAR_COL    = hexToRgb('#88BBDE');
const BLUSH_COL   = hexToRgb('#F09AAE');
const SPARKLE_COL = hexToRgb('#FFFFFF');

const MOOD_ADJUST = {
  joyful:  c => brighten(c, 0.09),
  content: c => c,
  neutral: c => desaturate(c, 0.04),
  down:    c => desaturate(darken(c, 0.16), 0.22),
  lonely:  c => desaturate(darken(c, 0.22), 0.30),
};

function makePalette(mood) {
  const adj  = MOOD_ADJUST[mood];
  const body = adj(BASE_BODY);
  const wing = adj(BASE_WING);
  return {
    body,
    bodyLight:  brighten(body, 0.24),
    highlight:  brighten(body, 0.52),
    shadow:     darken(body, 0.22),
    deepShadow: darken(body, 0.44),
    belly:      BASE_BELLY,
    bellyLight: brighten(BASE_BELLY, 0.12),
    bellyShad:  darken(BASE_BELLY, 0.08),
    wing,
    wingLight:  brighten(wing, 0.30),
    wingShad:   darken(wing, 0.30),
    wingDeep:   darken(wing, 0.50),
  };
}

// ── 그리드 엔진 ───────────────────────────────────────────────────────────────
function createGrid() {
  return Array.from({length: LOGICAL}, () => new Array(LOGICAL).fill(null));
}
function inBounds(x,y) { return x>=0 && y>=0 && x<LOGICAL && y<LOGICAL; }
function setCell(grid,x,y,color) {
  const ix=Math.round(x), iy=Math.round(y);
  if (!inBounds(ix,iy)) return;
  grid[iy][ix] = color;
}
function stampEllipse(grid,cx,cy,rx,ry,color) {
  if (rx<=0||ry<=0) return;
  for (let y=Math.floor(cy-ry-1); y<=Math.ceil(cy+ry+1); y++)
    for (let x=Math.floor(cx-rx-1); x<=Math.ceil(cx+rx+1); x++) {
      const dx=x+0.5-cx, dy=y+0.5-cy;
      if ((dx*dx)/(rx*rx)+(dy*dy)/(ry*ry)<=1) setCell(grid,x,y,color);
    }
}
function stampRotEllipse(grid,cx,cy,rx,ry,angleDeg,color) {
  if (rx<=0||ry<=0) return;
  const rad=(-angleDeg*Math.PI)/180, cos=Math.cos(rad), sin=Math.sin(rad);
  const maxR=Math.max(rx,ry);
  for (let y=Math.floor(cy-maxR-1); y<=Math.ceil(cy+maxR+1); y++)
    for (let x=Math.floor(cx-maxR-1); x<=Math.ceil(cx+maxR+1); x++) {
      const dx=x+0.5-cx, dy=y+0.5-cy;
      const lx=dx*cos-dy*sin, ly=dx*sin+dy*cos;
      if ((lx*lx)/(rx*rx)+(ly*ly)/(ry*ry)<=1) setCell(grid,x,y,color);
    }
}
function stampRect(grid,x0,y0,x1,y1,color) {
  for (let y=Math.round(y0); y<=Math.round(y1); y++)
    for (let x=Math.round(x0); x<=Math.round(x1); x++)
      setCell(grid,x,y,color);
}
function stampTriangle(grid,v1,v2,v3,color) {
  const sign=(p1,p2,p3)=>(p1[0]-p3[0])*(p2[1]-p3[1])-(p2[0]-p3[0])*(p1[1]-p3[1]);
  const xs=[v1[0],v2[0],v3[0]], ys=[v1[1],v2[1],v3[1]];
  for (let y=Math.floor(Math.min(...ys)); y<=Math.ceil(Math.max(...ys)); y++)
    for (let x=Math.floor(Math.min(...xs)); x<=Math.ceil(Math.max(...xs)); x++) {
      const pt=[x+0.5,y+0.5];
      const d1=sign(pt,v1,v2),d2=sign(pt,v2,v3),d3=sign(pt,v3,v1);
      if (!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))) setCell(grid,x,y,color);
    }
}
function stampOffsets(grid,ox,oy,offsets,color) {
  for (const [dx,dy] of offsets) setCell(grid,ox+dx,oy+dy,color);
}

// 5레이어 구체 음영: deepShadow 테두리 → shadow → body → bodyLight 하이라이트 → highlight 스페큘러
function shadedBlob(grid,cx,cy,rx,ry,p) {
  stampEllipse(grid,cx,cy,rx,ry,p.deepShadow);
  stampEllipse(grid,cx-rx*0.07,cy-ry*0.07,rx*0.90,ry*0.90,p.shadow);
  stampEllipse(grid,cx-rx*0.07,cy-ry*0.07,rx*0.81,ry*0.81,p.body);
  stampEllipse(grid,cx-rx*0.26,cy-ry*0.30,rx*0.40,ry*0.32,p.bodyLight);
  stampEllipse(grid,cx-rx*0.38,cy-ry*0.42,rx*0.16,ry*0.12,p.highlight);
}

// 날개 막 (막 2층 + 뼈대 선)
function shadedWing(grid,cx,cy,rx,ry,angle,p) {
  stampRotEllipse(grid,cx,cy,rx,ry,angle,p.wingDeep);
  stampRotEllipse(grid,cx,cy,rx*0.88,ry*0.88,angle,p.wingShad);
  stampRotEllipse(grid,cx-1,cy-1,rx*0.78,ry*0.78,angle,p.wing);
  stampRotEllipse(grid,cx-2,cy-2,rx*0.55,ry*0.50,angle,p.wingLight);
}

// 외곽선: 실루엣 1셀 팽창 후 빈 셀에 색상 칠하기
function computeOutline(grid) {
  const out = createGrid();
  for (let y=0; y<LOGICAL; y++)
    for (let x=0; x<LOGICAL; x++) {
      if (grid[y][x]) continue;
      for (const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1],[x-1,y-1],[x+1,y-1],[x-1,y+1],[x+1,y+1]])
        if (inBounds(nx,ny) && grid[ny][nx]) { out[y][x]=OUTLINE_COL; break; }
    }
  return out;
}

// ── 얼굴 표현 ────────────────────────────────────────────────────────────────
// cx,cy: 얼굴 중심  eyeDX: 눈 중심 X 오프셋  eyeY: 눈 Y
function paintFace(grid, cx, eyeY, eyeDX, mouthY, mood) {
  const lx=cx-eyeDX, rx=cx+eyeDX;

  // 눈 흰자
  stampEllipse(grid, lx, eyeY, 3.5, 3, SPARKLE_COL);
  stampEllipse(grid, rx, eyeY, 3.5, 3, SPARKLE_COL);

  // 눈동자 + 표정
  if (mood==='joyful') {
    // 초승달 눈 (위로 굽음)
    for (const [dx,dy] of [[-1,1],[0,0],[1,1],[-2,2],[2,2]]) {
      setCell(grid,lx+dx,eyeY+dy,FACE_COL);
      setCell(grid,rx+dx,eyeY+dy,FACE_COL);
    }
    // 볼터치
    stampEllipse(grid,lx-3,eyeY+3,2,1.2,BLUSH_COL);
    stampEllipse(grid,rx+3,eyeY+3,2,1.2,BLUSH_COL);
  } else if (mood==='content') {
    // 눈 감은 상태 (가로 선)
    for (const [dx,dy] of [[-2,0],[-1,-1],[0,-1],[1,-1],[2,0]]) {
      setCell(grid,lx+dx,eyeY+dy,FACE_COL);
      setCell(grid,rx+dx,eyeY+dy,FACE_COL);
    }
  } else if (mood==='down') {
    // 찡그린 눈 + 눈썹
    stampEllipse(grid,lx,eyeY,2.5,2,FACE_COL);
    stampEllipse(grid,rx,eyeY,2.5,2,FACE_COL);
    // 눈썹 (안쪽이 올라감)
    for (const [dx,dy] of [[-2,-3],[-1,-4],[0,-4],[1,-3]])
      setCell(grid,lx+dx,eyeY+dy,FACE_COL);
    for (const [dx,dy] of [[-1,-3],[0,-4],[1,-4],[2,-3]])
      setCell(grid,rx+dx,eyeY+dy,FACE_COL);
  } else if (mood==='lonely') {
    // 처진 눈 + 눈물
    stampEllipse(grid,lx,eyeY,2.5,2,FACE_COL);
    stampEllipse(grid,rx,eyeY,2.5,2,FACE_COL);
    // 눈물방울
    setCell(grid,rx+3,eyeY+2,TEAR_COL);
    setCell(grid,rx+3,eyeY+4,TEAR_COL);
    setCell(grid,rx+4,eyeY+3,TEAR_COL);
  } else {
    // neutral: 동그란 눈
    stampEllipse(grid,lx,eyeY,2.5,2.5,FACE_COL);
    stampEllipse(grid,rx,eyeY,2.5,2.5,FACE_COL);
    // 하이라이트
    setCell(grid,lx-1,eyeY-1,SPARKLE_COL);
    setCell(grid,rx-1,eyeY-1,SPARKLE_COL);
  }

  // 입
  if (mood==='joyful') {
    stampOffsets(grid,cx,mouthY,[[-3,0],[-2,1],[-1,1],[0,1],[1,1],[2,1],[3,0]],FACE_COL);
  } else if (mood==='down'||mood==='lonely') {
    stampOffsets(grid,cx,mouthY,[[-2,2],[-1,1],[0,1],[1,1],[2,2]],FACE_COL);
  } else {
    stampOffsets(grid,cx,mouthY,[[-2,0],[-1,0],[0,0],[1,0],[2,0]],FACE_COL);
  }
}

// ── 단계별 실루엣 ─────────────────────────────────────────────────────────────

function drawEgg(grid, p) {
  // 단순 타원 알 — 얼굴 없음
  shadedBlob(grid, 32, 35, 14, 18, p);
  // 달걀 끝부분 좁히기
  for (let y=17; y<=20; y++) {
    const hw = (y-17)*3.5;
    for (let x=0; x<LOGICAL; x++)
      if (grid[y][x] && Math.abs(x+0.5-32) > hw) grid[y][x] = null;
  }
  // 크림 반점
  const spots = [[24,26],[39,24],[41,34],[22,38],[35,46],[27,48],[40,43]];
  for (const [sx,sy] of spots) stampEllipse(grid,sx,sy,1.8,1.4,p.bellyLight);
}

function drawNewborn(grid, p) {
  // 아주 작은 몸 — 방금 부화, 날개 없음
  const hcy=26, bcy=42;
  // 꼬리
  stampRotEllipse(grid,42,46,6,2.5,-20,p.shadow);
  stampRotEllipse(grid,41,45,5,2,  -20,p.body);
  // 알 껍데기 조각
  stampTriangle(grid,[18,52],[24,52],[20,58],p.bellyShad);
  stampTriangle(grid,[38,52],[44,52],[42,58],p.bellyShad);
  // 몸통
  shadedBlob(grid,32,bcy,9,10,p);
  stampEllipse(grid,32,bcy+2,5,7,p.belly);
  // 짧은 팔
  stampRect(grid,20,40,22,47,p.shadow); stampRect(grid,21,40,22,47,p.body);
  stampRect(grid,42,40,44,47,p.shadow); stampRect(grid,42,40,43,47,p.body);
  // 발
  stampEllipse(grid,27,54,4,3,p.shadow); stampEllipse(grid,27,53,3.5,2.5,p.body);
  stampEllipse(grid,37,54,4,3,p.shadow); stampEllipse(grid,37,53,3.5,2.5,p.body);
  // 귀 뾰족이
  stampTriangle(grid,[26,17],[30,17],[28,12],p.shadow);
  stampTriangle(grid,[26,17],[30,17],[28,13],p.body);
  stampTriangle(grid,[34,17],[38,17],[36,12],p.shadow);
  stampTriangle(grid,[34,17],[38,17],[36,13],p.body);
  // 머리
  shadedBlob(grid,32,hcy,12,10,p);
  stampEllipse(grid,32,hcy+2,6,5,p.belly);
  paintFace(grid,32,hcy-1,6,hcy+5,'neutral');
}

function drawInfant(grid, p) {
  const hcy=24, bcy=41;
  // 짧은 꼬리
  stampRotEllipse(grid,44,44,7,3,-25,p.shadow);
  stampRotEllipse(grid,43,43,6,2.5,-25,p.body);
  // 몸통
  shadedBlob(grid,32,bcy,10,11,p);
  stampEllipse(grid,32,bcy+2,6,8,p.belly);
  // 날개 싹 (아주 작은 돌기)
  stampEllipse(grid,21,39,3,2,p.wingShad);
  stampEllipse(grid,20,38,2.5,1.5,p.wing);
  stampEllipse(grid,43,39,3,2,p.wingShad);
  stampEllipse(grid,44,38,2.5,1.5,p.wing);
  // 팔
  stampRect(grid,19,38,22,47,p.shadow); stampRect(grid,20,38,22,47,p.body);
  stampRect(grid,42,38,45,47,p.shadow); stampRect(grid,42,38,44,47,p.body);
  // 발
  stampRect(grid,24,52,28,58,p.shadow); stampRect(grid,25,52,28,58,p.body);
  stampRect(grid,36,52,40,58,p.shadow); stampRect(grid,36,52,39,58,p.body);
  // 귀
  stampTriangle(grid,[24,15],[29,15],[27,9],p.wingShad);
  stampTriangle(grid,[24,15],[29,15],[27,10],p.wing);
  stampTriangle(grid,[35,15],[40,15],[37,9],p.wingShad);
  stampTriangle(grid,[35,15],[40,15],[37,10],p.wing);
  // 머리
  shadedBlob(grid,32,hcy,13,11,p);
  stampEllipse(grid,32,hcy+3,7,6,p.belly);
}

function drawChild(grid, p) {
  const hcy=23, bcy=40;
  // 꼬리
  stampRotEllipse(grid,46,43,8,3,-30,p.shadow);
  stampRotEllipse(grid,45,42,7,2.5,-30,p.body);
  stampEllipse(grid,52,37,3,3,p.wingShad); stampEllipse(grid,52,37,2,2,p.body);
  // 작은 날개
  shadedWing(grid,20,33,9,5,-20,p);
  shadedWing(grid,44,33,9,5,20,p);
  // 몸통
  shadedBlob(grid,32,bcy,11,12,p);
  stampEllipse(grid,32,bcy+2,7,9,p.belly);
  // 팔
  stampRect(grid,18,37,21,48,p.shadow); stampRect(grid,19,37,21,48,p.body);
  stampRect(grid,43,37,46,48,p.shadow); stampRect(grid,43,37,45,48,p.body);
  // 발
  stampRect(grid,23,52,28,59,p.shadow); stampRect(grid,24,52,28,59,p.body);
  stampRect(grid,36,52,41,59,p.shadow); stampRect(grid,36,52,40,59,p.body);
  // 귀
  stampTriangle(grid,[23,14],[29,14],[26,8],p.wingShad);
  stampTriangle(grid,[23,14],[29,14],[26,9],p.wing);
  stampTriangle(grid,[35,14],[41,14],[38,8],p.wingShad);
  stampTriangle(grid,[35,14],[41,14],[38,9],p.wing);
  // 머리
  shadedBlob(grid,32,hcy,13,11,p);
  stampEllipse(grid,32,hcy+3,7,6,p.belly);
  // 이마 작은 뿔
  stampTriangle(grid,[29,12],[35,12],[32,6],p.wingShad);
  stampTriangle(grid,[29,12],[35,12],[32,7],p.wing);
}

function drawAdolescent(grid, p) {
  const hcy=21, bcy=39;
  // 꼬리
  stampRotEllipse(grid,47,42,9,3.5,-30,p.shadow);
  stampRotEllipse(grid,46,41,8,3,-30,p.body);
  stampEllipse(grid,54,35,3.5,3.5,p.wingShad); stampEllipse(grid,54,35,2.5,2.5,p.body);
  // 중간 크기 날개
  shadedWing(grid,17,31,12,6,-25,p);
  shadedWing(grid,47,31,12,6,25,p);
  // 날개 아래 접힌 부분
  shadedWing(grid,18,38,8,4,-50,p);
  shadedWing(grid,46,38,8,4,50,p);
  // 몸통
  shadedBlob(grid,32,bcy,11,13,p);
  stampEllipse(grid,32,bcy+2,7,10,p.belly);
  // 팔
  stampRect(grid,17,36,21,49,p.shadow); stampRect(grid,18,36,21,49,p.body);
  stampRect(grid,43,36,47,49,p.shadow); stampRect(grid,43,36,46,49,p.body);
  // 발
  stampRect(grid,23,53,28,60,p.shadow); stampRect(grid,24,53,28,60,p.body);
  stampRect(grid,36,53,41,60,p.shadow); stampRect(grid,36,53,40,60,p.body);
  // 귀
  stampTriangle(grid,[22,13],[28,13],[25,6],p.wingShad);
  stampTriangle(grid,[22,13],[28,13],[25,7],p.wing);
  stampTriangle(grid,[36,13],[42,13],[39,6],p.wingShad);
  stampTriangle(grid,[36,13],[42,13],[39,7],p.wing);
  // 머리
  shadedBlob(grid,32,hcy,13,11,p);
  stampEllipse(grid,32,hcy+3,7,6,p.belly);
  // 뿔 2개
  stampTriangle(grid,[27,11],[32,11],[29,4],p.wingShad);
  stampTriangle(grid,[27,11],[32,11],[29,5],p.wing);
  stampTriangle(grid,[32,11],[37,11],[35,4],p.wingShad);
  stampTriangle(grid,[32,11],[37,11],[35,5],p.wing);
}

function drawYoungAdult(grid, p) {
  const hcy=20, bcy=38;
  // 꼬리
  stampRotEllipse(grid,48,41,10,4,-28,p.shadow);
  stampRotEllipse(grid,47,40,9,3.5,-28,p.body);
  stampRotEllipse(grid,55,33,6,2.5,-45,p.body);
  stampTriangle(grid,[58,28],[63,24],[57,27],p.wingShad);
  // 큰 날개 (상단 + 하단 막)
  shadedWing(grid,13,26,14,7,-20,p);
  shadedWing(grid,14,35,10,5,-55,p);
  shadedWing(grid,51,26,14,7,20,p);
  shadedWing(grid,50,35,10,5,55,p);
  // 날개 뼈대 선
  stampRect(grid,13,24,14,38,p.wingDeep);
  stampRect(grid,50,24,51,38,p.wingDeep);
  // 몸통
  shadedBlob(grid,32,bcy,12,14,p);
  stampEllipse(grid,32,bcy+3,8,11,p.belly);
  stampEllipse(grid,32,bcy-3,5,3,p.bellyShad); // 목 그림자
  // 팔
  stampRect(grid,17,35,21,50,p.shadow); stampRect(grid,18,35,21,50,p.body);
  stampRect(grid,43,35,47,50,p.shadow); stampRect(grid,43,35,46,50,p.body);
  // 발
  stampRect(grid,23,53,28,61,p.shadow); stampRect(grid,24,53,28,61,p.body);
  stampRect(grid,36,53,41,61,p.shadow); stampRect(grid,36,53,40,61,p.body);
  // 발톱
  stampTriangle(grid,[23,61],[25,61],[24,63],p.deepShadow);
  stampTriangle(grid,[26,61],[28,61],[27,63],p.deepShadow);
  stampTriangle(grid,[36,61],[38,61],[37,63],p.deepShadow);
  stampTriangle(grid,[39,61],[41,61],[40,63],p.deepShadow);
  // 귀
  stampTriangle(grid,[21,12],[27,12],[24,5],p.wingShad);
  stampTriangle(grid,[21,12],[27,12],[24,6],p.wing);
  stampTriangle(grid,[37,12],[43,12],[40,5],p.wingShad);
  stampTriangle(grid,[37,12],[43,12],[40,6],p.wing);
  // 머리
  shadedBlob(grid,32,hcy,14,12,p);
  stampEllipse(grid,32,hcy+4,8,7,p.belly);
  // 뿔 3개 (크레스트)
  stampTriangle(grid,[25,10],[31,10],[28,2],p.wingShad);
  stampTriangle(grid,[25,10],[31,10],[28,3],p.wing);
  stampTriangle(grid,[29,9],[35,9],[32,-1],p.wingShad);
  stampTriangle(grid,[29,9],[35,9],[32,1],p.wing);
  stampTriangle(grid,[33,10],[39,10],[36,2],p.wingShad);
  stampTriangle(grid,[33,10],[39,10],[36,3],p.wing);
}

function drawElder(grid, p) {
  const hcy=19, bcy=38;
  // 꼬리 (더 두껍고 길음)
  stampRotEllipse(grid,49,42,11,5,-25,p.shadow);
  stampRotEllipse(grid,48,41,10,4,-25,p.body);
  stampRotEllipse(grid,57,34,7,3,-42,p.body);
  stampTriangle(grid,[60,28],[63,22],[58,27],p.wingShad);
  // 웅장한 날개
  shadedWing(grid,10,23,16,8,-18,p);
  shadedWing(grid,11,34,12,6,-55,p);
  shadedWing(grid,54,23,16,8,18,p);
  shadedWing(grid,53,34,12,6,55,p);
  stampRect(grid,10,21,11,38,p.wingDeep);
  stampRect(grid,53,21,54,38,p.wingDeep);
  // 몸통 (더 크고 둥글)
  shadedBlob(grid,32,bcy,13,15,p);
  stampEllipse(grid,32,bcy+3,9,12,p.belly);
  // 가슴 문양 (장식)
  stampEllipse(grid,32,bcy-1,4,3,p.wingShad);
  stampEllipse(grid,32,bcy+5,3,4,p.wingShad);
  // 팔 (약간 더 두꺼움)
  stampRect(grid,16,35,21,51,p.shadow); stampRect(grid,17,35,21,51,p.body);
  stampRect(grid,43,35,48,51,p.shadow); stampRect(grid,43,35,47,51,p.body);
  // 발
  stampRect(grid,22,54,28,62,p.shadow); stampRect(grid,23,54,28,62,p.body);
  stampRect(grid,36,54,42,62,p.shadow); stampRect(grid,36,54,41,62,p.body);
  // 발톱
  for (const [ax,ay] of [[22,62],[25,62],[28,62],[36,62],[39,62],[42,62]])
    stampTriangle(grid,[ax-1,ay],[ax+1,ay],[ax,ay+3],p.deepShadow);
  // 수염 (장로 특징)
  stampRect(grid,8,30,17,31,p.wingShad);
  stampRect(grid,47,30,56,31,p.wingShad);
  stampRect(grid,6,33,14,34,p.wingShad);
  stampRect(grid,50,33,58,34,p.wingShad);
  // 귀 (더 크고 장식적)
  stampTriangle(grid,[19,11],[26,11],[22,3],p.wingShad);
  stampTriangle(grid,[19,11],[26,11],[22,4],p.wing);
  stampTriangle(grid,[38,11],[45,11],[42,3],p.wingShad);
  stampTriangle(grid,[38,11],[45,11],[42,4],p.wing);
  // 머리
  shadedBlob(grid,32,hcy,14,12,p);
  stampEllipse(grid,32,hcy+4,8,7,p.belly);
  // 이마 보석 (장로 특징)
  stampEllipse(grid,32,hcy-4,3,2.5,p.wingShad);
  stampEllipse(grid,32,hcy-4,2,1.5,p.wingLight);
  // 뿔 (더 굵고 휘어짐)
  stampTriangle(grid,[23,10],[30,10],[25,1],p.wingShad);
  stampTriangle(grid,[23,10],[30,10],[25,2],p.wing);
  stampTriangle(grid,[28,8],[35,8],[31,-2],p.wingShad);
  stampTriangle(grid,[28,8],[35,8],[31,0],p.wing);
  stampTriangle(grid,[34,10],[41,10],[39,1],p.wingShad);
  stampTriangle(grid,[34,10],[41,10],[39,2],p.wing);
}

// ── 단계별 얼굴 위치 ──────────────────────────────────────────────────────────
const STAGE_FACE = {
  newborn:    { cx:32, eyeY:25, eyeDX:6,  mouthY:30 },
  infant:     { cx:32, eyeY:23, eyeDX:7,  mouthY:29 },
  child:      { cx:32, eyeY:22, eyeDX:7,  mouthY:28 },
  adolescent: { cx:32, eyeY:20, eyeDX:7,  mouthY:26 },
  youngAdult: { cx:32, eyeY:19, eyeDX:7,  mouthY:25 },
  elder:      { cx:32, eyeY:18, eyeDX:7,  mouthY:24 },
};

const STAGE_DRAW = {
  egg:        drawEgg,
  newborn:    drawNewborn,
  infant:     drawInfant,
  child:      drawChild,
  adolescent: drawAdolescent,
  youngAdult: drawYoungAdult,
  elder:      drawElder,
};

// ── 렌더링 ────────────────────────────────────────────────────────────────────
function createImage() {
  return new Promise((res,rej) =>
    new Jimp(CANVAS,CANVAS,Jimp.rgbaToInt(0,0,0,0),(err,img)=>err?rej(err):res(img))
  );
}
function setPixel(img,x,y,r,g,b) {
  const {width:w,height:h,data:d}=img.bitmap;
  if (x<0||y<0||x>=w||y>=h) return;
  const i=(y*w+x)*4;
  d[i]=Math.round(r); d[i+1]=Math.round(g); d[i+2]=Math.round(b); d[i+3]=255;
}
function blitGrid(img,body,outline) {
  for (let gy=0;gy<LOGICAL;gy++)
    for (let gx=0;gx<LOGICAL;gx++) {
      const c=body[gy][gx]||outline[gy][gx];
      if (!c) continue;
      for (let sy=0;sy<SCALE;sy++)
        for (let sx=0;sx<SCALE;sx++)
          setPixel(img,gx*SCALE+sx,gy*SCALE+sy,...c);
    }
}
function writeImage(img,p) {
  return new Promise((res,rej)=>img.write(p,e=>e?rej(e):res()));
}

// ── 생성 실행 ─────────────────────────────────────────────────────────────────
const STAGES = ['egg','newborn','infant','child','adolescent','youngAdult','elder'];
const MOODS  = ['neutral','joyful','content','down','lonely'];

async function generate() {
  for (const stage of STAGES) {
    for (const mood of MOODS) {
      const p    = makePalette(mood);
      const grid = createGrid();
      STAGE_DRAW[stage](grid, p);
      const outline = computeOutline(grid);
      if (stage !== 'egg') {
        const f = STAGE_FACE[stage];
        paintFace(grid, f.cx, f.eyeY, f.eyeDX, f.mouthY, mood);
      }
      const img = await createImage();
      blitGrid(img, grid, outline);
      const out = path.join(CHARACTER_DIR, `${stage}-${mood}.png`);
      await writeImage(img, out);
      console.log('wrote', `${stage}-${mood}.png`);
    }
  }
  console.log('\n전체 완료');
}

generate().catch(e=>{ console.error(e); process.exit(1); });
