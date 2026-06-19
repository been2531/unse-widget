@AGENTS.md

# 행동 원칙

## 1. 코딩 전 생각
가정은 명시적으로 밝힌다. 해석이 여러 가지면 먼저 물어본다.
더 단순한 대안이 있으면 제시한다. 혼란스러우면 진행하지 말고 질문한다.

## 2. 단순함 우선
요청된 것만 구현한다. 추가 기능, 단독 사용 코드의 추상화, 미래를 위한 설계 금지.
200줄이 50줄로 줄 수 있으면 다시 쓴다.

## 3. 외과적 변경
건드려야 할 것만 건드린다. 무관한 코드 리팩터 금지.
기존 스타일을 맞추고, 내 변경이 만든 dead code만 제거한다.

## 4. 목표 중심 실행
다단계 작업은 각 단계에 검증 체크포인트를 포함한다.
명확한 완료 기준 없이 진행하지 않는다.

# 프로젝트 컨텍스트

**스택**: Expo SDK 56 · React Native · Expo Router · reanimated v3 · gesture-handler v2 · lottie-react-native

**캐릭터**: 7단계 성장 (egg→elder) · 3감정 (neutral/joyful/lonely) · Lottie JSON 애니메이션

**에뮬레이터**: AVD `unse_test` · RAM 7.3GB → 직렬 빌드 필수 · `adb reverse tcp:8081 tcp:8081` 매번 필수

**빌드 판단**:
- `.tsx/.ts/.js/assets` 변경만 → 경로 A (Metro 핫리로드, ~2분)
- 네이티브 패키지/`android/` 변경 → 경로 B (전체 빌드, ~15-20분)
