/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      // 마이크로 인터랙션 애니메이션 (Chapter 16)
      keyframes: {
        // 페이드 인/아웃
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        // 슬라이드 인
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // 스케일 효과
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        // 모달/오버레이용
        overlayShow: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        contentShow: {
          '0%': { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        // 셰이크 효과 (에러 피드백)
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        // 바운스 효과
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // 스피너/로딩
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // 알림 벨 흔들기
        ring: {
          '0%': { transform: 'rotate(0)' },
          '5%': { transform: 'rotate(15deg)' },
          '10%': { transform: 'rotate(-15deg)' },
          '15%': { transform: 'rotate(15deg)' },
          '20%': { transform: 'rotate(-15deg)' },
          '25%': { transform: 'rotate(0)' },
          '100%': { transform: 'rotate(0)' },
        },
        // 체크마크
        checkmark: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        // 페이드
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 150ms ease-in',
        // 슬라이드
        'slide-in-up': 'slideInUp 200ms ease-out',
        'slide-in-down': 'slideInDown 200ms ease-out',
        'slide-in-left': 'slideInLeft 200ms ease-out',
        'slide-in-right': 'slideInRight 200ms ease-out',
        // 스케일
        'scale-in': 'scaleIn 200ms ease-out',
        'scale-out': 'scaleOut 150ms ease-in',
        // 모달
        'overlay-show': 'overlayShow 200ms ease-out',
        'content-show': 'contentShow 200ms ease-out',
        // 피드백
        'shake': 'shake 500ms ease-in-out',
        'bounce-in': 'bounceIn 400ms ease-out',
        // 지속형
        'spin-slow': 'spin 2s linear infinite',
        'ring': 'ring 2s ease-in-out infinite',
        // 체크마크
        'checkmark': 'checkmark 300ms ease-out forwards',
      },
      // 트랜지션 타이밍 (Chapter 16 가이드라인)
      transitionDuration: {
        '50': '50ms',    // 초미세 (포커스 링)
        '100': '100ms',  // 미세 (hover, 버튼 누름)
        '200': '200ms',  // 기본 (드롭다운, 토글)
        '300': '300ms',  // 중간 (모달, 패널)
        '500': '500ms',  // 대형 (페이지 전환)
      },
      transitionTimingFunction: {
        'ease-out-custom': 'cubic-bezier(0.16, 1, 0.3, 1)', // 부드러운 감속
        'ease-in-custom': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)', // 부드러운 가속
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // 바운스 효과
      },
    },
  },
  plugins: [],
}
