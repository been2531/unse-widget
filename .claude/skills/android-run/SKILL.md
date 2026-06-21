---
description: Build and run the unse-widget Android app on the local emulator (AVD: unse_test). Covers emulator start, APK build, install, and Metro launch. Required for any session that needs to test the app.
---

# Android 빌드 & 실행

## 환경 정보

- Android SDK: `D:\AndroidSdk`
- AVD 이름: `unse_test`
- 패키지명: `com.jhahn.unse`
- RAM: 7.3GB → 직렬 빌드 필수 (`parallel=false`)
- APK 경로: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 시작 전 상태 확인

```powershell
# 에뮬레이터 실행 여부
D:\AndroidSdk\platform-tools\adb.exe devices
# "emulator-XXXX   device" 있으면 이미 실행 중

# APK 존재 여부
Test-Path "D:\react_project\unse-widget\android\app\build\outputs\apk\debug\app-debug.apk"

# 변경 종류 판단
# .tsx/.ts/.js/assets 만 → JS-only → 경로 A
# package.json/android//plugins//app.json 변경 → Native → 경로 B
```

---

## 경로 A — JS-only 변경 (~2분)
> 조건: APK 있음 + tsx/ts/js/assets만 변경

```powershell
# Step 1. 에뮬레이터 시작 (꺼져 있을 때만)
Start-Process -FilePath "D:\AndroidSdk\emulator\emulator.exe" `
  -ArgumentList "-avd","unse_test","-no-snapshot-load","-memory","1024" `
  -WindowStyle Normal
```

```bash
# Step 2. 부팅 완료 대기
until D:/AndroidSdk/platform-tools/adb.exe shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do sleep 3; done; echo "부팅 완료"
```

```powershell
# Step 3. adb reverse (매번 필수)
D:\AndroidSdk\platform-tools\adb.exe reverse tcp:8081 tcp:8081

# Step 4. Metro 시작 + 자동 앱 실행 (한 번에)
# --android 플래그가 번들링 완료 후 앱을 자동으로 열어줌
cd "D:\react_project\unse-widget"
npx expo start --android --port 8081
# 앱이 자동으로 열리지 않으면 수동 실행:
# D:\AndroidSdk\platform-tools\adb.exe shell monkey -p com.jhahn.unse -c android.intent.category.LAUNCHER 1
```

> Metro를 백그라운드로 실행하고 잠시 후 스크린샷으로 확인하세요.

---

## 경로 B — Native 변경 or APK 없음 (~15-20분)
> 조건: APK 없음 OR 네이티브 패키지/플러그인/android/ 변경

```powershell
# Step 1. 에뮬레이터 시작 (꺼져 있을 때만)
Start-Process -FilePath "D:\AndroidSdk\emulator\emulator.exe" `
  -ArgumentList "-avd","unse_test","-no-snapshot-load","-memory","1024" `
  -WindowStyle Normal
```

```bash
# Step 2. 부팅 완료 대기
until D:/AndroidSdk/platform-tools/adb.exe shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do sleep 3; done; echo "부팅 완료"
```

```powershell
# Step 3. adb reverse
D:\AndroidSdk\platform-tools\adb.exe reverse tcp:8081 tcp:8081

# Step 4. 전체 빌드 (Metro + 앱 실행 자동 포함)
cd "D:\react_project\unse-widget"
npx expo run:android 2>&1
```

> **RAM 7.3GB 주의**: `android/gradle.properties`에 직렬 설정 필수
> ```
> org.gradle.parallel=false
> org.gradle.workers.max=1
> ```

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
| 앱 검은 화면 | Metro 아직 번들링 중 | 잠시 후 재확인 |
| Metro 연결 안 됨 | 포트 충돌 | `adb reverse` 재실행, Metro 재시작 |
| 빌드 메모리 오류 | RAM 부족 | `gradle.properties` 직렬 설정 확인 |
| APK install 실패 | 서명 불일치 | `adb uninstall com.anonymous.unsewidget` 후 재빌드 |
