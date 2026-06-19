# unse-widget 작업 정리

이 문서는 2026-06-17 세션에서 진행한 작업 내역 정리입니다.

## 앱 개요 (현재)

생년월일 기반 오늘의 운세(총운/띠/별자리) + **포켓몬 TCG 스타일 카드 수집 가챠** 앱.
6원소 × 한국 신화 생물 캐릭터, 5단계 희귀도, 합성 시스템.

> ⚠️ **컨셉 변경 (2026-06-18)**: 초기의 "가상 펫 먹이주기/쓰다듬기" 컨셉은 폐기.
> 먹이주기·돌보기·캐릭터 성장(애정도/방치일수) 로직은 더 이상 사용하지 않는 방향.
> 홈 화면 위젯도 먹이주기 버튼 없이 카드/운세 중심으로 재편 예정.

## 세션 시작 시점 현황 (이미 구현되어 있던 것)

- 온보딩(생년월일 입력) → 띠/별자리 도출 → 해시 기반 일별 운세 선택
- 운세 콘텐츠 뱅크: 총운 50 + 띠 12×6 + 별자리 12×6 ≈ 194개
- 캐릭터 성장 단계, 애정도/방치일수 계산, 돌보기 액션, 무드(표정) 도출 로직
- AsyncStorage 영속화, 홈 화면 UI, 안드로이드 홈 화면 위젯(30분 주기 갱신)
- `expo prebuild` 완료 (android/ 폴더 존재)

미완 상태였던 4가지 중 B → A → C 순서로 이번 세션에서 작업했고, D(iOS)는 보류.

## 이번 세션에서 한 일

### B. 위젯 내 빠른 먹이주기
- `src/widgets/FortuneWidget.tsx`에 `먹이 주기` 버튼 추가. `clickAction="QUICK_FEED"`를
  feedAvailable일 때만 부여해 독립된 탭 영역으로 동작, 오늘 이미 줬으면 비활성 표시.
- `src/widgets/widgetTaskHandler.tsx`에서 `canFeedToday`로 `feedAvailable` 계산해 전달.
- 라이브러리 네이티브 코드(`WidgetFactory.java`) 확인 결과, `clickAction` 있는 자식 뷰는
  부모(`OPEN_APP`)와 독립된 탭 영역으로 등록됨을 확인.

### A. 자정 근처 위젯 자동 갱신 (AlarmManager)
- `android/`, `ios/`가 gitignore되어 prebuild마다 재생성되는 구조라, 로컬 Expo config
  plugin(`plugins/withMidnightAlarmReceiver.js`)으로 구현 — prebuild할 때마다 재적용됨.
- 매니페스트에 `RECEIVE_BOOT_COMPLETED` 권한 + `MidnightAlarmReceiver` 등록,
  `MidnightAlarmReceiver.kt`/`MidnightAlarmScheduler.kt` 생성, `MainApplication.onCreate()`에
  스케줄 호출 주입.
- `SCHEDULE_EXACT_ALARM` 특수 권한이 필요 없는 `setAndAllowWhileIdle` 사용 (사용자 선택:
  "괜찮은 정도면 충분, 추가 권한 요청 없이").
- 알람 발화 시 위젯의 `ACTION_APPWIDGET_UPDATE`를 직접 브로드캐스트해 즉시 갱신,
  다음 날 자정 알람도 재예약. 재부팅 시엔 `BOOT_COMPLETED`에서 재예약만 수행.

### C. 캐릭터 아트 교체 (절차적 생성)
- 기존 placeholder(모든 단계가 같은 원 모양 + "PLACEHOLDER ART" 워터마크)를
  `scripts/generate-character-art.js`로 교체.
- `jimp-compact`(순수 JS, 네이티브 빌드 불필요)로 4단계 × 5감정 = 20장 + 액세서리 3장을
  코드로 렌더링. 2배 해상도로 그린 뒤 다운샘플해 안티앨리어싱.
- 단계별 실루엣 차별화: 알(점박이+균열) → 솜털 새끼(스텁 팔+머리 깃털+깨진 알껍데기) →
  어린 동물(귀+날개+다리+꼬리) → 성체(더 크고 화려한 버전).
- 감정별 표정/색조 차별화, 배경 투명 처리.

### D. iOS 위젯 — 보류
- macOS/Xcode 없이는 빌드·검증이 불가능해 사용자 판단으로 스킵.

## 검증 (Android 에뮬레이터)

- `D:\AndroidSdk` 활용, AVD `unse_test`로 실제 빌드 + 설치 + 실행까지 확인.
- 이 PC는 총 메모리 7.3GB로 빡빡해서, 이전에 한 번 네이티브(NDK) 빌드가 메모리 부족으로
  실패한 적이 있었음. `CMAKE_BUILD_PARALLEL_LEVEL=1` + gradle 워커 1개로 직렬 빌드해서
  해결, 빌드 성공(`BUILD SUCCESSFUL`).
- `android/local.properties`에 `sdk.dir` 설정 누락도 같이 해결.
- 에뮬레이터에 설치 후 Metro 연결, 온보딩(생년월일 입력) 자동 입력까지 진행해
  홈 화면(캐릭터+돌보기 버튼+오늘의 운세)이 정상 렌더링되는 것을 스크린샷으로 확인.

## Git

- 기존 Expo 템플릿 보일러플레이트(explore 탭, animated-icon, app-tabs 등) 제거.
- 커밋 `50417f1`로 전체 변경사항 반영, `https://github.com/been2531/unse-widget`에 push 완료.

## 남은 것 / 다음에 볼 부분

- D(iOS 위젯) — macOS 환경에서 별도 작업 필요.
- 위젯 빠른 먹이주기 탭, 자정 알람 실제 발화는 코드 레벨로는 확인했지만 시간이 걸리는
  검증(실제 자정 대기, 위젯 탭 UI 자동화)은 아직 실기기 수동 확인이 필요.

---

## 2026-06-18~19 세션 — 가챠 시스템 확장 & 홈카드 전면 개선

### 가챠 & 컬렉션

| 작업 | 상세 |
|------|------|
| 희귀도 5단계화 | common(★)/rare(★★)/epic(★★★)/legendary(★★★★)/mythic(★★★★★) |
| 가챠 확률 조정 | 72/20/6/2 → 70/20/7/2/1(mythic) |
| 합성 시스템 | 동일 카드 4~5장 → 상위 등급 합성, 성공률 65/40/20/10% |
| 합성 UI | 가챠 화면 오버레이 모달 — 확인→롤링→성공/실패 3단계 |
| 캐릭터 확장 | 구미호/이무기/삼족오/봉황/도깨비/해태 + 사신(청룡/백호/주작/현무) 추가 → 총 58종+ |
| Mythic 캐릭터 | 원소별 신화 최고단계 6종 추가 (천화신/용왕/뇌신/목신/명부왕/태양신) |
| 광고 리워드 | 30코인 → 10코인 |
| 컬렉션 화면 | 탭 필터(캐릭터/운세/스킨/전체), 카드 탭 상세 모달, chevron 버튼 |

### 홈화면 카드 전면 개선

| 작업 | 상세 |
|------|------|
| 카드 하단 TCG 스타일 재설계 | 캐릭터명(등급/원소 연동) + 원소 뱃지 + 운세 텍스트 + 희귀도 별 |
| 아트워크 창 내부 프레임 | Skia RoundedRect 이중 테두리 (원소색 + 흰 하이라이트) |
| 캐릭터 팝아웃 3D 효과 | 캐릭터가 내부 프레임 아래로 CHAR_BLEED만큼 삐져나와 입체감 |
| 외부 테두리 분리 | 캐릭터 위 별도 Skia 캔버스 Layer 6으로 카드가 캐릭터 담는 효과 |
| 배경 아트워크 창 국한 | Skia Group clip — 원소 그라디언트 배경이 내부 프레임 안에만 표시 |
| 이펙트 Rare+ 전용 | Common은 파티클/발광 없음, Rare 이상부터 카드 전체 이펙트 |
| 원소 선택 피커 | 6원소 버튼 — 미보유 원소 🔒 잠금, AsyncStorage 저장 |
| 등급 선택 피커 | 5등급 버튼 — 미보유 등급 🔒 잠금, 소유한 최고 등급 자동 선택 |
| 캐릭터명 CARD_POOL 기반 | 원소+등급 조합으로 실제 nameKo 표시 (염왕, 불새, 구미호 등) |
| ScrollView 적용 | 홈화면 콘텐츠 세로 스크롤 지원 |
| 운세카드 버프 연동 | 가챠에서 운세카드 뽑으면 오늘의 운세에 버프 표시 |
| cardCustomization 저장 | 선택 원소·등급 AsyncStorage 영속화 |

### TypeScript 상태
- 전체 `npx tsc --noEmit` 오류 0개 ✅

---

## 2026-06-17 세션 2 — AI 이미지 생성 도입 시도

### 목표
jimp 절차적 생성 스프라이트를 AI 생성 이미지로 교체해 퀄리티 향상.

### 스크리닝 결과 (무료 API 후보)

| 후보 | 판정 | 이유 |
|------|------|------|
| Pollinations.ai | ✅ 사용 가능 | 무료·무키·무제한. 소규모 팀 운영이라 장기 안정성 리스크 있으나 정적 에셋 1회 생성 용도로는 적합 |
| Google Gemini API | ⚠️ 보류 | 키 발급 성공했으나 이미지 생성 모델 무료 쿼터가 0으로 할당됨(프로젝트에 API 미활성화 또는 빌링 미연결 문제로 추정) |
| Hugging Face | — | 테스트 미진행 (Pollinations로 방향 결정) |

### Pollinations.ai 프롬프트 이터레이션

**v1 프롬프트** (CREATURE: "round creature with shell-like body")
- 결과: egg→거북이→드래곤→식물 생물 — 단계마다 다른 캐릭터처럼 보임. 일관성 부족.

**v2 프롬프트** (CREATURE: "dragon-gecko, teal-green scales, cream belly, amber eyes")
- youngAdult 결과물을 기준으로 역산해 캐릭터 컨셉 확정.
- 날개 성장 경로 명시: 없음 → stub → fledgling → full → elaborate
- 결과: 전 7단계가 같은 캐릭터로 읽힘 ✅, 감정 표현 명확 ✅

**사용자 피드백**
> "귀엽게 갈 거면 귀엽게, 멋지게 갈 거면 멋지게 — 컨셉을 정확히 잡아야 한다."
> 현재 dragon-gecko는 중간 어딘가에 위치. 다음 이터레이션에서 방향 확정 필요.

### 생성된 스크립트

| 파일 | 용도 |
|------|------|
| `scripts/test-ai-art.js` | Pollinations.ai 테스트용 (API 키 불필요, 현재 v2 프롬프트 적용) |
| `scripts/generate-ai-art-gemini.js` | Gemini API 전체 생성용 (v2 프롬프트, 현재 키 문제로 미사용) |

### 현재 상태

- `scripts/test-output/` 에 v2 프롬프트 기준 9장 생성 완료 (품질 확인됨)
- `src/assets/character/` 의 실제 앱 번들 스프라이트는 아직 jimp 버전 그대로

### 다음 할 일

1. **캐릭터 컨셉 방향 결정** — "귀엽게" vs "멋지게" 중 하나 선택
2. **Pollinations.ai로 35장 전체 생성** → `src/assets/character/` 적용
   - `scripts/test-ai-art.js` 를 전체 생성 모드로 전환하거나 별도 스크립트 작성
3. **Gemini API 사용 재시도** (선택) — Google Cloud Console에서 Generative Language API
   활성화 + 빌링 계정 연결 후 재시도 가능
4. **실기기 검증** — 위젯 빠른 먹이주기 탭, 자정 알람 발화
