# unse-widget 작업 목록

> 최종 업데이트: 2026-06-21 (루틴 7회차)
> 컨셉 원칙: **한국신화 × 운세** — 이 두 가지는 고정. 나머지 디자인·구조·UI는 루틴/Claude가 자유롭게 개선 가능.

---

## 🔴 코드 리뷰 이슈

- ~~[리뷰] gacha.tsx:299 — `MultiResultGrid` 내부 `.map()` 안에서 `useSharedValue`·`useEffect` 호출 → `MultiCardItem` 컴포넌트로 분리 완료~~ → 완료
- ~~[리뷰] gacha.tsx:502 — `handlePull` catch 블록 빈 채로 무음 처리 → Alert 추가 완료~~ → 완료
- ~~[리뷰] fortune.tsx — `DailyFortune.dii`(띠별 운세)·`.star`(별자리별 운세) 미표시 → 무료 섹션 2개 추가 완료~~ → 완료



- ~~[리뷰] fortune.tsx:129 — 코인 부족 시 spend() 실패를 catch {} 무음 처리 → 사용자에게 Alert 없음 (adsRemoved 경로)~~ → 완료
- ~~[리뷰] coin-shop.tsx:15 — grantRemoveAds import됐지만 handleRemoveAds에서 호출 안 됨 (unused import)~~ → 완료
- ~~[리뷰] gacha.tsx handleAdReward — 광고 오류(result === 'error') 무음 처리 → Alert 추가~~ → 완료
- ~~[리뷰] gacha.tsx doSynthesis — 스토리지 실패 시 'rolling' 상태 고착 → try-catch + fail 전환~~ → 완료
- ~~[리뷰] fortune.tsx watchAdForCategory — 광고 오류 무음 처리 → Alert 추가~~ → 완료
- ~~[리뷰] fortune.tsx shareFortuneResult — 공유 메시지에 raw 날짜 'YYYY-MM-DD' 노출 → 한국어 날짜 형식으로 수정~~ → 완료
- ~~[리뷰] collection.tsx — fortune 빈 상태 안내 문구 오류 → 수정~~ → 완료
- ~~[리뷰] index.tsx — mood 계산 하드코딩 → 실제 캐릭터 상태로 수정~~ → 완료
- ~~[리뷰] gacha.tsx handleAdReward — setSpinning(false) try 밖 → finally로 이동~~ → 완료
- ~~[리뷰] coin-shop.tsx handleWatchAd — setAdLoading(false) try 밖 → finally로 이동~~ → 완료
- ~~[리뷰] fortune.tsx watchAdForCategory — setAdLoading(null) try 밖 → finally로 이동~~ → 완료
- ~~[리뷰] storage/streak.ts — getStreak() try-catch 누락~~ → 완료
- ~~[리뷰] storage/freePulls.ts — try-catch 누락~~ → 완료
- ~~[리뷰] storage/adRewards.ts — getAdsRemaining() try-catch 누락~~ → 완료
- ~~[리뷰] storage/todayFortuneCard.ts — getTodayFortuneBuff() JSON.parse try-catch 누락~~ → 완료
- ~~[리뷰] storage/characterState.ts — loadCharacterState() try-catch 누락~~ → 완료
- ~~[리뷰] synthesis.ts:29 — legendary→mythic 합성 차단 버그 수정~~ → 완료
- ~~[리뷰] storage/userProfile.ts — loadUserProfile() try-catch 누락~~ → 완료
- ~~[리뷰] streak.ts:32 — checkInStreak() AsyncStorage.setItem try-catch 누락 → 홈 화면 영구 로딩 고착~~ → 완료
- ~~[리뷰] adRewards.ts:19 — recordAdReward() try-catch 누락 → 광고 코인 미적립~~ → 완료
- ~~[리뷰] coin-shop.tsx:76 — Promise.all().catch() 미처리 → 스켈레톤 무한 표시~~ → 완료
- ~~[리뷰] fortune.tsx:122 — checkInStreak 에러 시 setLoading(false) 미호출~~ → 완료

---

## ✅ 진행 중 / 최근 완료

- ~~가챠 무료뽑기 버튼 통합~~ → 별도 버튼 제거, 1회 뽑기 버튼이 무료/유료 상태 전환
- ~~가챠 서브텍스트 가독성 수정~~ → #555 → rgba(0,0,0,0.60) (노란 배경 위 가독성 개선)
- ~~홈화면 보조 버튼 제거~~ → 컬렉션·카드뽑기 버튼 제거 (탭바로 충분히 이동 가능)
- ~~하단 탭바 추가~~ → 5탭(홈·운세·가챠·컬렉션·상점), CustomTabBar, 금색 인디케이터
- ~~카드 아트 재생성~~ → 17장 완료 (배경 유지+포켓몬 TCG 등급별 구도 적용)
- ~~홈화면 수집 진행도 뱃지~~ → week strip 아래 진행 바 + "N/24 수집" 추가 완료
- ~~AdMob 크래시 수정~~ → lazy require로 모듈 로드 방어 완료
- ~~오늘의 운세 공유 기능~~ → fortune.tsx에 Share API 공유 버튼 추가 완료
- ~~gacha.tsx 테스트 버튼 제거~~ → `[ 테스트: +500코인 ]` 버튼 제거 완료
- ~~온보딩 생년월일 자동 포커스 + 폰트 통일~~ → 완료
- ~~스트릭 배지 1일차부터 표시~~ → `>= 1` 이미 적용됨 확인
- ~~`src/storage/purchases.ts` 광고 제거 구매 상태 저장~~ → 완료
- ~~`coin-shop.tsx` 광고 제거 상품 카드 추가~~ → 완료
- ~~운세 잠금 해제 광고제거 구매 시 50코인 차감 분기~~ → 완료
- ~~컬렉션 빈 상태(empty state) 화면~~ → 탭별 안내 UI + 가챠/코인샵 바로가기 완료
- ~~컬렉션 카드 상세 신화 설명 강화~~ → 한국신화 배지·원소·수집일 추가 완료
- 루틴 에이전트 설정 완료 (매 3시간, master 직접 push, 세션당 95% 컨텍스트 활용)
- `CHARACTER_ART_GUIDE.md` 작성 완료 (AI 생성 프롬프트 포함)
- ~~gacha/collection: 접근성 레이블 누락 보완, overScrollMode 통일~~ → 완료
- ~~fortune: 종합 점수 색상 → 카드 테두리·공유 버튼·해금 카드 테두리 연동~~ → 완료
- ~~fortune: 오류 상태 뒤로 가기 버튼 추가~~ → 완료
- ~~gacha: 무료 뽑기 에러 무음 catch → Alert 처리~~ → 완료
- ~~coin-shop: 스킨 구매 버튼 accessibilityLabel 추가~~ → 완료

---

## 🎨 캐릭터 아트

> 세부 AI 생성 프롬프트는 `CHARACTER_ART_GUIDE.md` 참고

### 교체 필수 (한국신화 컨셉 불일치)
- ~~`lightning_1` 천붕이~~ → 뇌신 영아 형태로 교체 완료
- ~~`nature_3` 산신~~ → 조선 도포 산신령으로 교체 완료
- ~~`nature_4` 단군~~ → 고조선 제의복 신인으로 교체 완료
- ~~`light_4` 환인~~ → 한국 최고천신으로 교체 완료
- ~~`fire_4` 태양신조~~ → 오색 깃털 디테일 교체 완료

### 스타일 보완 (치비 → 신화적으로)
- ~~`fire_1` 봉아~~ → 한국 오색 봉황 새끼로 보완 완료
- ~~`water_1` 이무기~~ → 용꿈 꾸는 신비로운 이무기로 보완 완료
- ~~`dark_1` 도깨비~~ → 뿔+도깨비방망이 한국 도깨비로 보완 완료

### 신규 생성 (Pollinations.ai Flux 생성 + 흰 배경 제거 완료)
- ~~`gumiho_1/2/3`~~ → 미호·여우·구미호 시리즈 완료
- ~~`imugi_1/2/3`~~ → 이미·수리·이무기 시리즈 완료
- ~~`samjogo_1/2/3`~~ → 삼미·해조·삼족오 시리즈 완료

### 유지 (교체 불필요)
`fire_2/3`, `water_2/3/4`, `lightning_2/3/4`, `nature_1/2`, `dark_2/3/4`, `light_1/2/3`

### 카드 아트 배경 처리 방향 변경
- [ ] **배경 유지로 전환** — 흰 배경 제거(BFS flood-fill) 대신 배경 살리기
  - 배경 있는 버전이 더 고급스럽고 자연스러움 (흰 배경 제거 시 오히려 이상하게 보임)
  - `scripts/generate-card-art.js`: BASE 프롬프트에서 `white background` 제거, `rich atmospheric background` 추가 완료
  - ~~`scripts/apply-card-art.js`: Jimp BFS flood-fill 배경 제거 로직 제거 또는 비활성화 필요~~ → 완료 (단순 fs.copyFileSync로 교체)
  - 전체 카드(24장) 배경 유지 버전으로 재생성 필요
- ~~**캐릭터 아트 구도 개선** — 얼굴 클로즈업 강화~~ → 완료
  - 포켓몬 TCG V/VMAX 구도 참고: COMMON=3/4바디, RARE=상반신, EPIC+=흉상~클로즈업
  - 이미지 비율도 512×512 → 512×768 세로형으로 변경 (카드 포맷 맞춤)
  - 재생성 필요 (`node scripts/generate-card-art.js` → `node scripts/apply-card-art.js`)

---

## 🟡 콘텐츠 / UI

### 카드 스킨 시스템 (완료)
- ~~`src/gacha/frameStyles.ts` — FrameStyle 인터페이스 + 4종 프레임 정의~~ → 완료
- ~~`src/storage/equippedFrame.ts` — AsyncStorage 장착/해제 영속화~~ → 완료
- ~~홈(index.tsx) — equippedFrameId 로드·적용, Layer 6 glow+border 오버라이드~~ → 완료
- ~~컬렉션(collection.tsx) — 스킨 탭 장착/해제 버튼, 장착 상태 표시~~ → 완료

### 카드 비주얼 업그레이드 (벤치마킹: 포켓몬 TCG · Shadowverse · 한국 운세앱)
- ~~코너 브래킷 장식 (Layer 6) — rare+ / 프레임 장착 시 4코너 tick marks~~ → 완료
- ~~legendary/mythic 등급 글로우 (Layer 6) — 외부 blur glow 추가~~ → 완료

### UI 완성도
- ~~코인샵 화면 안정성 — grantRemoveAds 미연결 버그 수정~~ → 완료
- ~~로딩 스켈레톤 — 데이터 로딩 중 빈 화면 대신 placeholder~~ → 홈/운세/가챠/코인샵 완료
- [ ] **전체 화면 디자인 세련도** — 세련되고 고급스러운 최신 디자인 기준으로 지속 개선
  - 촌스럽거나 아마추어 느낌 요소 발견 시 즉시 개선 (루틴·Claude 모두 적용)
  - 벤치마크: 포켓몬 TCG, 원신, 고급 운세앱 디자인 레퍼런스
  - 폰트: F.eb/F.bk 위계 강화, 여백·타이포그래피 정교화
  - 컬러: 금빛(#C8A84B) 액센트 일관 적용, 배경 그라디언트 깊이감 강화

### 접근성
- ~~주요 Pressable에 `accessibilityLabel` 추가 — 스토어 심사 영향~~ → 홈/운세/가챠/컬렉션/코인샵 완료

### 리텐션 / 참여
- [ ] 스트릭 알림 — 자정 전 "오늘 운세 확인하셨나요?" 푸시 알림 (expo-notifications, 네이티브)
- ~~컬렉션 완성률 공유 기능 — "나는 24/24 수집 완료!" 이미지 공유~~ → Share API 텍스트 공유 완료

---

---

## 🟣 허가 대기 (루틴이 구현 전 확인 요청하는 항목)

> 아래 항목은 자동 루틴이 제안만 하고 구현하지 않음. 직접 확인 후 🟡로 이동하면 구현 허가.

- ~~[제안] 홈화면: 카드 배경 스킨 — rare 동심원 파동, epic+ 네뷸라 강화, mythic 황금 먼지~~ → 완료
- ~~[제안] 홈화면: 카드 하단 정보 영역 — 한국 금빛(#C8A84B) 구분선·UNSE CARD 골드 텍스트~~ → 완료
- ~~[제안] 홈화면: infoCard 왼쪽 치우침 수정 — alignSelf stretch→center~~ → 완료
- ~~[제안] 운세 화면: 한국 금빛 상단 액센트 바 + 점수 라디얼 글로우~~ → 완료
- ~~[제안] 가챠 화면: 희귀도별 배경 패턴 + 외부 glow 링 + 금빛 구분선~~ → 완료
- ~~[제안] 컬렉션 그리드: 미수집 카드 안개 효과 — Skia opacity + fog gradient 오버레이~~ → 완료
- ~~[제안] 코인샵: 금빛 섹션 타이틀 액센트 + 디바이더 + 패키지 하이라이트 쉐도우~~ → 완료

---

## 🔵 출시 준비

### 코인샵 스킨 상점 (완료)
- ~~신규 스킨 4종 추가~~ → 완료 (도깨비/봉황/구미호/삼족오, 코인샵 전용)
  - 가격: 800 / 900 / 1200 / 1500 코인 (1100코인팩 구매 유도)
  - `src/storage/skinPurchases.ts` — 구매 이력 AsyncStorage 영속화
  - `src/gacha/frameStyles.ts` — shop_dokkaebi/phoenix/gumiho/samjogo 추가
  - 코인샵 내 장착/해제 버튼 포함

### 과금 결제

**IAP 상품 목록:**
| SKU | 상품명 | 가격 | 유형 |
|-----|--------|------|------|
| `remove_ads` | 광고 제거 (영구) | ₩4,900 | 일회성 |
| `coins_100` | 코인 100개 | ₩1,100 | 소모성 |
| `coins_330` | 코인 330개 (+10%) | ₩2,900 | 소모성 |
| `coins_1100` | 코인 1100개 (+20%) | ₩8,900 | 소모성 |

**[JS-only] 먼저 할 수 있는 것:**
- ~~`src/storage/purchases.ts` — `remove_ads` 상태 저장/조회~~ → 완료
- ~~`coin-shop.tsx` 상단에 광고 제거 상품 카드 추가~~ → 완료
- ~~운세 잠금 해제: 광고 제거 구매 시 광고 대신 50코인 차감으로 분기~~ → 완료

**[네이티브] 빌드 필요 — 코인 IAP 결제 연동:**
- [ ] `react-native-iap` 설치 + `app.json` 플러그인 추가
- [ ] Play Console에 4개 인앱 상품 등록 (SKU: coins_100/330/1100, remove_ads)
- [ ] `handlePurchase` 스텁 → 실제 IAP 호출 교체
  ```ts
  await initConnection();
  await requestPurchase({ sku });
  // 결제 완료 후 코인 지급 + finishTransaction
  ```
- [ ] 구매 복원(restore purchases) 처리
- [ ] 영수증 서버 검증 (선택, 출시 후 고려)

### 스토어 등록
- [ ] 앱 아이콘 (1024×1024) — 봉황 또는 도깨비 컨셉
- [ ] 스크린샷 5장 (홈/컬렉션/가챠/운세/코인샵)
- [ ] 개인정보처리방침 URL
- [ ] Google Play Console 등록 및 심사 제출

---

## ✅ 완료 이력

- ~~컬렉션 탭 버튼 글자 가시성~~ → 색상 0.4→0.78, paddingTop 클리핑 방지
- ~~컬렉션 오버스크롤 반등~~ → `overScrollMode="never"`
- ~~카드 캐릭터 아트 흰 배경~~ → jimp BFS flood-fill 투명 처리
- ~~원소 이펙트 불일치 (용 띠→번개)~~ → `'용'→'water'` 스왑
- ~~컬렉션 탭 알약→언더라인 리디자인~~ → 완료
- ~~홈화면 수집 진행도 뱃지~~ → 완료
- ~~오늘의 운세 공유 기능~~ → fortune.tsx Share API 완료
- ~~gacha.tsx 테스트 버튼 제거~~ → 완료
- ~~온보딩 생년월일 자동 포커스 + 폰트 통일~~ → 완료
- ~~fortune·gacha·index: F. 폰트 시스템 전면 적용 — 하드코딩 fontWeight 제거~~ → 완료
- ~~fortune: 종합 점수 카운트업 애니메이션 (0→실제점수, 800ms)~~ → 완료
- ~~fortune: 헤더에 연속 확인 스트릭 배지 추가~~ → 완료
- ~~gacha: 합성 모달 minicard에 실제 캐릭터 아트 표시~~ → 완료
- ~~gacha: 10연차 하이라이트 행에 캐릭터 아트·레어리티 배지 추가~~ → 완료
- ~~index: 홈화면 카드 하단에 캐릭터 기분(mood) 배지 표시~~ → 완료

---

## 빌드 참고

```
JS-only 변경  → Metro 핫리로드 (~2분)
네이티브 변경 → npx expo run:android (~15-20분)
패키지명: com.jhahn.unse
gradle.properties: parallel=false, workers.max=1 (RAM 7.3GB)
```
