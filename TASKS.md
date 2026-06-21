# unse-widget 작업 목록

> 최종 업데이트: 2026-06-21

---

## 🔴 버그 (즉시 수정)

*현재 미해결 버그 없음*

---

## 🟡 콘텐츠 / UI 완성도

### 2. 스트릭 1일차부터 배지 표시
- 현재 `streak.currentStreak >= 2` 조건 → `>= 1`로 변경, 첫날부터 방문 유도

### 6. 컬렉션 빈 상태 UI
- fortune/skin/전체 탭에서 카드 없을 때 안내 화면 없음
- JS-only: FlatList `ListEmptyComponent` 추가

### 8. 코인샵 폰트 일관성
- `coin-shop.tsx`에서 `fontWeight` 하드코딩 사용, `F.*` 미적용

### 4. 오늘의 운세 공유 기능
- fortune.tsx에 Share API로 운세 텍스트 공유 버튼 추가 → 바이럴

---

## 🔵 출시 준비

### 5. IAP 연동 (Play Billing)
- `react-native-iap` 설치 → 코인 3패키지 결제 연결
- 현재: Alert만 표시

### 6. gacha.tsx 개발용 테스트 코드 제거
- `[ 테스트: +500코인 ]` 버튼이 프로덕션 코드에 존재 → 출시 전 제거

### 7. 접근성 라벨 추가
- 주요 Pressable에 `accessibilityLabel` 누락 → 스토어 심사 영향 가능

### 8. 스토어 준비
- 앱 아이콘 (1024×1024)
- 스크린샷 5장
- 개인정보처리방침 URL
- Google Play Console 등록

### 9. 접근성 accessibilityLabel
- 주요 `Pressable`에 `accessibilityLabel` 누락 → 스토어 심사 영향

---

## 완료된 버그 (2026-06-20)

- ~~컬렉션 탭 버튼 글자 가시성~~ → 색상 0.4→0.78, paddingTop 추가로 클리핑 방지
- ~~컬렉션 오버스크롤 반등~~ → `overScrollMode="never"`
- ~~카드 캐릭터 아트 흰 배경~~ → jimp BFS flood-fill로 24개 PNG 투명 처리
- ~~원소 이펙트 불일치 (용 띠→번개/뇌신)~~ → `'용'→'water'` 스왑으로 용녀/물 캐릭터와 일치

## 완료된 콘텐츠/UI (2026-06-21)

- ~~홈화면 컬렉션 진행도 뱃지~~ → 컬렉션 버튼 하단에 황금색 진행 바 추가

---

## 완료된 UI/UX (2026-06-21)

- ~~주간 캘린더 스트립 로딩 검증~~ → `profile && weekDays` 조건 이미 처리됨, 확인 완료
- ~~온보딩 생년월일 자동 포커스~~ → YYYY 4자 → MM, MM 2자 → DD 자동 포커스, returnKeyType 추가
- ~~온보딩 폰트 통일~~ → `fontWeight` 하드코딩 → `fontFamily: F.bk/F.eb/F.r` 로 교체

---

## 빌드 참고

```
JS-only 변경 → Metro 핫리로드 (~2분)
네이티브 변경 → npx expo run:android (~15-20분)
gradle.properties: parallel=false, workers.max=1 (RAM 7.3GB)
```
