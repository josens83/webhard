# EduVault Mobile App

React Native 모바일 앱 (iOS & Android)

## 설치 및 실행

### 필수 요구사항
- Node.js 18+
- Expo CLI
- iOS: Xcode (Mac only)
- Android: Android Studio

### 개발 환경 설정

```bash
cd mobile
npm install

# Expo 시작
npx expo start

# iOS 실행
npx expo start --ios

# Android 실행
npx expo start --android
```

### 빌드

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# Android 빌드
eas build --platform android

# iOS 빌드
eas build --platform ios
```

### 배포

```bash
# Android Play Store
eas submit --platform android

# iOS App Store
eas submit --platform ios
```

## 주요 기능

- ✅ 사용자 인증 (로그인/회원가입)
- ✅ 파일 목록 및 정렬 (최신순/인기순/평점순)
- ✅ 파일 검색 및 카테고리 필터
- ✅ 파일 상세 정보 및 미리보기
- ✅ 파일 구매 및 다운로드
- ✅ 파일 평가 및 댓글
- ✅ 찜하기 (즐겨찾기)
- ✅ 캐시 충전 (다양한 결제 수단)
- ✅ 보너스 캐시 및 포인트 시스템
- ✅ 마이페이지 (구매내역, 다운로드내역)
- ✅ 실시간 알림
- ✅ 오프라인 지원

## 화면 구성

### 인증
- **LoginScreen**: 이메일/아이디 로그인, 소셜 로그인 (Google, Kakao)
- **RegisterScreen**: 회원가입, 웰컴 보너스 안내

### 메인
- **HomeScreen**: 유저 정보 카드, 카테고리, 인기/최신 파일
- **FilesScreen**: 파일 목록, 정렬, 페이지네이션
- **SearchScreen**: 파일 검색, 카테고리 필터
- **FileDetailScreen**: 파일 상세, 구매/다운로드, 평가, 댓글
- **MyPageScreen**: 프로필, 구매내역, 설정, 로그아웃
- **ChargeScreen**: 캐시 충전, 보너스 미리보기, 결제 수단 선택

## 기술 스택

- React Native
- Expo
- TypeScript
- React Navigation
- React Query
- Zustand
- Axios

## 환경 변수

`app.json`에서 API URL 설정:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-domain.com/api"
    }
  }
}
```
