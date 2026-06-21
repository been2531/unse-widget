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
- ~~[리뷰] collection.tsx — fortune 빈 상태 안내 문구 오류("운세 확인 시 카드가 쌓입니다" → 실제로는 가챠에서 획득) → 수정~~ → 완료
- ~~[리뷰] index.tsx — mood 계산이 항상 affection=100, neglectDays=0 하드코딩 → 실제 캐릭터 상태로 수정~~ → 완료
- ~~[리뷰] gacha.tsx handleAdReward — setSpinning(false) try 밖 → finally로 이동, storage 실패 시 UI 고착 방지~~ → 완료
- ~~[리뷰] coin-shop.tsx handleWatchAd — setAdLoading(false) try 밖 → finally로 이동~~ → 완료
- ~~[리뷰] fortune.tsx watchAdForCategory — setAdLoading(null) try 밖 → finally로 이동, 버튼 영구 비활성화 방지~~ → 완료
- ~~[리뷰] storage/streak.ts — getStreak() try-catch 누락 → 스토리지 손상 시 앱 크래시 방지~~ → 완료
- ~~[리뷰] storage/freePulls.ts — try-catch 누락 → 가챠 로딩 화면 영구 고착 방지~~ → 완료
- ~~[리뷰] storage/adRewards.ts — getAdsRemaining() try-catch 누락~~ → 완료
- ~~[리뷰] storage/todayFortuneCard.ts — getTodayFortuneBuff() JSON.parse try-catch 누락~~ → 완료
- ~~[리뷰] storage/characterState.ts — loadCharacterState() try-catch 누락 → 홈 화면 로딩 영구 고착 방지~~ → 완료
- ~~[리뷰] synthesis.ts:29 — `card.rarity === 'legendary'` 조기 반환으로 legendary→mythic 합성 차단 → fire_3·water_3·lightning_3·light_3 합성 불가 버그 수정~~ → 완료
- ~~[리뷰] storage/userProfile.ts — loadUserProfile() try-catch 누락 → 프로필 JSON 손상 시 홈/운세 로딩 영구 고착 방지~~ → 완료

- ~~[리뷰] streak.ts:32 — checkInStreak() AsyncStorage.setItem try-catch 누락 → index.tsx IIFE에서 저장 실패 시 setLoading(false) 미호출, 홈 화면 영구 로딩 고착~~ → 완료
- ~~[리뷰] adRewards.ts:19 — recordAdReward() try-catch 누락 → 광고 시청 후 코인 저장(Promise.all) 실패 시 코인 미적립 (callers에 catch 있어 crash는 방지되나 데이터 손실)~~ → 완료

---

## ✅ 진행 중 / 최근 완료

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

---

## 🟡 콘텐츠 / UI

### UI 완성도
- [ ] 전체 화면 디자인 세련도 — 홈 순으로 계속 점검 (6회차: fortune·gacha·index F.폰트 전면 적용, 가챠 캐릭터 아트 표시, 홈 mood 배지, 운세 스트릭 배지 완료)
- [ ] ~~컬렉션 카드 상세에서 한국신화 설명(description) 표시 강화~~ → 완료
- [ ] ~~빈 컬렉션 상태(empty state) 화면~~ → 완료
- ~~로딩 스켈레톤 — 데이터 로딩 중 빈 화면 대신 placeholder~~ → 홈/운세/가챠 3개 화면 완료
- [ ] ~~스트릭 배지 1일차부터 표시~~ → 완료

### 접근성
- ~~주요 Pressable에 `accessibilityLabel` 추가 — 스토어 심사 영향~~ → 홈/운세/가챠/컬렉션/코인샵 완료

### 리텐션 / 참여
- [ ] 스트릭 알림 — 자정 전 "오늘 운세 확인하셨나요?" 푸시 알림 (expo-notifications, 네이티브)
- ~~컬렉션 완성률 공유 기능 — "나는 24/24 수집 완료!" 이미지 공유~~ → Share API 텍스트 공유 완료

---

## 🔵 출시 준비

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

**[네이티브] 빌드 필요:**
- [ ] `react-native-iap` 설치 + `app.json` 플러그인 추가
- [ ] Play Console 4개 인앱 상품 등록
- [ ] `handlePurchase` 스텁 → 실제 IAP 호출 교체
- [ ] 구매 복원(restore) 처리

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
