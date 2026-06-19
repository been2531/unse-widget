---
description: Build and run the unse-widget Android app on the local emulator (AVD: unse_test). Covers emulator start, APK build, install, and Metro launch. Required for any session that needs to test the app.
---

# Android 빌드 & 실행

## 환경 정보

- Android SDK: `D:\AndroidSdk`
- AVD 이름: `unse_test`
- 패키지명: `com.anonymous.unsewidget`
- RAM: 7.3GB → 직렬 빌드 필수 (`parallel=false`)
- APK 경로: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 시작 전 상태 확인 — 반드시 먼저 실행

```powershell
# 1) 에뮬레이터 실행 여부
D:\AndroidSdk\platform-tools\adb.exe devices
# 출력에 "emulator-XXXX   device" 있으면 이미 실행 중

# 2) APK 존재 여부
Test-Path "D:\react_project\unse-widget\android\app\build\outputs\apk\debug\app-debug.apk"
# True = APK 있음, False = 빌드 필요

# 3) 변경 종류 판단
# - .tsx / .ts / .js / assets 만 변경 → JS-only → Metro 핫리로드 (재빌드 불필요)
# - package.json / android/ / plugins/ / app.json 변경 → Native 변경 → 전체 빌드 필요
```

---

## 상황별 진행 경로

### ✅ 경로 A — JS-only 변경 (가장 빠름, ~2분)
> 조건: APK 있음 + tsx/ts/js/assets만 변경

```
Step 1. 에뮬레이터 시작 (안 켜져 있을 때만)
Step 2. APK 설치 (이미 설치돼 있으면 생략 가능)
Step 3. adb reverse (매번 필수)
Step 4. Metro 시작
Step 5. 앱 실행 → 자동으로 새 번들 로드
```

### 🔨 경로 B — Native 변경 or APK 없음 (~15-20분)
> 조건: APK 없음 OR 네이티브 패키지/플러그인 변경

```
Step 1. 에뮬레이터 시작 (안 켜져 있을 때만)
Step 2. 전체 빌드 (npx expo run:android)
Step 3. adb reverse (매번 필수)
Step 4. Metro는 빌드 중 자동 시작됨
```

---

## Step 1 — 에뮬레이터 시작 (꺼져 있을 때만)

```powershell
Start-Process -FilePath "D:\AndroidSdk\emulator\emulator.exe" `
  -ArgumentList "-avd","unse_test","-no-snapshot-load","-memory","1024" `
  -WindowStyle Normal
```

부팅 완료 대기:
```bash
until D:/AndroidSdk/platform-tools/adb.exe shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do sleep 3; done; echo "부팅 완료"
```

---

## Step 2 — APK 설치 (경로 A에서만)

```powershell
D:\AndroidSdk\platform-tools\adb.exe install -r `
  "D:\react_project\unse-widget\android\app\build\outputs\apk\debug\app-debug.apk"
```

---

## Step 2 — 전체 빌드 (경로 B에서만)

```powershell
cd "D:\react_project\unse-widget"
npx expo run:android 2>&1
```

> **RAM 7.3GB 주의**: `android/gradle.properties`에 아래 설정 필수
> ```
> org.gradle.parallel=false
> org.gradle.workers.max=1
> ```
> 빌드 시간: 첫 빌드 ~15-20분 / 캐시 후 ~3-5분

---

## Step 3 — adb reverse (매번 필수 — Metro 연결의 핵심)

에뮬레이터 부팅 직후 반드시 실행. 이걸 빠뜨리면 앱이 Metro에 연결 못 하고 검은 화면.

```powershell
D:\AndroidSdk\platform-tools\adb.exe reverse tcp:8081 tcp:8081
```

---

## Step 4 — Metro 번들러 시작 (경로 A에서만, 백그라운드)

```powershell
cd "D:\react_project\unse-widget"
npx expo start --port 8081
```

Metro 번들링 완료 확인 (출력 파일에서):
```
Android Bundled XXXXX ms index.js (XXXX modules)
```

---

## Step 5 — 앱 실행

```powershell
D:\AndroidSdk\platform-tools\adb.exe shell monkey `
  -p com.anonymous.unsewidget -c android.intent.category.LAUNCHER 1
```

---

## 스크린샷 캡처

```powershell
D:\AndroidSdk\platform-tools\adb.exe shell screencap /sdcard/screen.png
D:\AndroidSdk\platform-tools\adb.exe pull /sdcard/screen.png "D:\react_project\unse-widget\scripts\test-output\emulator-screen.png"
```

리사이즈 후 Read로 확인:
```powershell
cd D:\react_project\unse-widget
node -e "const Jimp=require('jimp-compact'); Jimp.read('scripts/test-output/emulator-screen.png').then(i=>i.resize(400,Jimp.AUTO).write('scripts/test-output/emulator-screen-sm.png',()=>console.log('done')))"
```

---

## 자주 겪는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| 앱 검은 화면 | adb reverse 안 함 | `adb reverse tcp:8081 tcp:8081` 실행 |
| 앱 검은 화면 | Metro 아직 번들링 중 | Metro 출력에서 "Bundled" 확인 후 앱 재실행 |
| Metro 연결 안 됨 | 포트 충돌 | `adb reverse` 재실행, Metro 재시작 |
| 빌드 메모리 오류 | RAM 부족 | `gradle.properties` 직렬 설정 확인 |
| APK install 실패 | 서명 불일치 | `adb uninstall com.anonymous.unsewidget` 후 재설치 |
