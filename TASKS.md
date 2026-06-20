# unse-widget 작업 목록

> 최종 업데이트: 2026-06-20

---

## 🔴 버그 (즉시 수정)

*현재 미해결 버그 없음*

---

## 🟡 콘텐츠 / UI 완성도

### 1. 홈화면 컬렉션 진행도 뱃지
- "8/24 수집" 같은 간단한 뱃지 홈에 표시

### 3. 주간 캘린더 스트립 로딩 검증
- `profile && weekDays` null일 때 weekStrip 미표시 → 로딩 플로우 확인

---

## 🔵 출시 준비

### 4. IAP 연동 (Play Billing)
- `react-native-iap` 설치 → 코인 3패키지 결제 연결
- 현재: Alert만 표시

### 5. 스토어 준비
- 앱 아이콘 (1024×1024)
- 스크린샷 5장
- 개인정보처리방침 URL
- Google Play Console 등록

---

## 완료된 버그 (2026-06-20)

- ~~컬렉션 탭 버튼 글자 가시성~~ → 색상 0.4→0.78, paddingTop 추가로 클리핑 방지
- ~~컬렉션 오버스크롤 반등~~ → `overScrollMode="never"`
- ~~카드 캐릭터 아트 흰 배경~~ → jimp BFS flood-fill로 24개 PNG 투명 처리
- ~~원소 이펙트 불일치 (용 띠→번개/뇌신)~~ → `'용'→'water'` 스왑으로 용녀/물 캐릭터와 일치

---

## 빌드 참고

```
JS-only 변경 → Metro 핫리로드 (~2분)
네이티브 변경 → npx expo run:android (~15-20분)
gradle.properties: parallel=false, workers.max=1 (RAM 7.3GB)
```
