# unse-widget 진행 현황

## 앱 개요

생년월일 기반 오늘의 운세 + **포켓몬 TCG 스타일 카드 수집 가챠** 앱.  
6원소 × 한국 신화 캐릭터 24종, 5단계 희귀도.

---

## 구현 완료

### 홈화면 카드 (index.tsx)
- 포켓몬 TCG 3D 틸트 + Skia 홀로그램 (HOLO+HOLO2 교차 shimmer)
- 4레이어 시차(parallax): 배경(정적) → 캐릭터(32/20+scale) → 전경파티클(54/34) → 홀로그램(195+)
- 원소별 전경 파티클 (Layer 4b), 스페큘러 하이라이트 (Layer 3)
- 캐릭터 아트프레임: overflow:hidden 클리핑, 원소색 단일 테두리, 바닥 그림자
- 주간 운세 캘린더 스트립, 행운 정보 행 (색/숫자/방향)
- 한 화면 fit (gap 11, 버튼 압축)
- DII 매핑: 용 띠→물(용녀) 일치 포함 12간지 × 6원소

### 운세 (fortune.tsx)
- 5종 운세: 총운(무료) / 재물·연애·건강·직장(광고 해금)
- 종합 점수 + 카테고리 점수 바 + 행운 정보 패널

### 가챠 (gacha.tsx)
- 1회/10회 뽑기, 카드 플립 애니메이션
- 확률: 70/20/7/2/1 (common~mythic)
- 합성: 동일 카드 4~5장 → 상위 등급, 성공률 65/40/20/10%
- 광고 코인 10코인/회 (5회/일 한도), 무료뽑기 1회/일

### 캐릭터 & 카드
- 한국신화 24종: 6원소 × 4단계 (봉황/용녀/뇌신/산신/도깨비/선녀 계열)
- Pollinations.ai flux 모델로 생성 (`scripts/generate-card-characters.js`)
- 흰 배경 BFS flood-fill 제거 완료 (`scripts/remove-white-bg.js`)
- `src/assets/character/` 24장 PNG 투명 배경 적용

### 컬렉션 (collection.tsx)
- 3열 그리드, flex 레이아웃 (이미지 64% 충전, 이름 바로 아래)
- 카드 상세 모달: 어두운 배경, 흰 텍스트, 원소색 테두리, 캐릭터명 소제목
- 탭 텍스트 가시성 개선 (0.4→0.78 opacity, paddingTop 추가)
- 오버스크롤 없음 (overScrollMode="never")
- 원소 필터, 수집률 진행 바

### 인프라
- AdMob 실제 게시자 ID 적용 (`ca-app-pub-4631230760372985/...`)
- Android 릴리스 키스토어 완료 (`android/keystore.properties`, PKCS12)
- 스트릭 시스템: 7일+ 연속 시 카드 등급 상승

---

## 알려진 이슈 / 미완료 → TASKS.md 참조
