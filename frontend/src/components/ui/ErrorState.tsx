import React from 'react'

/**
 * ErrorState 컴포넌트
 *
 * @description 에러 발생 시 표시하는 UI. 사용자에게 3가지를 알려줌:
 * 1. 무슨 문제가 발생했는지
 * 2. 왜 발생했는지 (가능하다면)
 * 3. 어떻게 해결할 수 있는지
 *
 * @example
 * // 기본 사용
 * <ErrorState
 *   title="데이터를 불러올 수 없습니다"
 *   message="서버와 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
 *   onRetry={() => refetch()}
 * />
 *
 * @example
 * // 전체 화면 에러
 * <ErrorState
 *   title="페이지를 찾을 수 없습니다"
 *   message="요청하신 페이지가 존재하지 않습니다."
 *   onGoHome={() => navigate('/')}
 * />
 */

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  onGoBack?: () => void
  onGoHome?: () => void
  className?: string
}

export function ErrorState({
  title = '문제가 발생했습니다',
  message = '데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  onRetry,
  onGoBack,
  onGoHome,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* 에러 아이콘 */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      {/* 제목 */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>

      {/* 메시지 */}
      <p className="mt-1 max-w-sm text-gray-500 dark:text-gray-400">
        {message}
      </p>

      {/* 액션 버튼들 */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            다시 시도
          </button>
        )}
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            뒤로 가기
          </button>
        )}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            홈으로
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * 인라인 에러 알림 (작은 영역용)
 */
export function InlineError({
  message,
  onRetry,
  className = '',
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-red-800 dark:text-red-200">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
          재시도
        </button>
      )}
    </div>
  )
}

// ============================================
// 에러 유형별 Pre-built 컴포넌트
// ============================================

const errorMessages = {
  network: {
    title: '연결할 수 없습니다',
    message: '인터넷 연결을 확인하고 다시 시도해주세요.',
  },
  server: {
    title: '서버에 문제가 발생했습니다',
    message: '잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.',
  },
  unauthorized: {
    title: '로그인이 필요합니다',
    message: '이 페이지에 접근하려면 먼저 로그인해주세요.',
  },
  forbidden: {
    title: '접근 권한이 없습니다',
    message: '이 페이지에 접근할 권한이 없습니다.',
  },
  notFound: {
    title: '페이지를 찾을 수 없습니다',
    message: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
  },
  timeout: {
    title: '요청 시간이 초과되었습니다',
    message: '서버 응답이 너무 오래 걸립니다. 나중에 다시 시도해주세요.',
  },
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState {...errorMessages.network} onRetry={onRetry} />
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState {...errorMessages.server} onRetry={onRetry} />
}

export function UnauthorizedError({ onGoHome }: { onGoHome?: () => void }) {
  return <ErrorState {...errorMessages.unauthorized} onGoHome={onGoHome} />
}

export function ForbiddenError({ onGoBack }: { onGoBack?: () => void }) {
  return <ErrorState {...errorMessages.forbidden} onGoBack={onGoBack} />
}

export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return <ErrorState {...errorMessages.notFound} onGoHome={onGoHome} />
}

export function TimeoutError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState {...errorMessages.timeout} onRetry={onRetry} />
}

/**
 * 에러 타입에 따라 적절한 ErrorState 반환
 */
export function getErrorComponent(
  error: unknown,
  options: { onRetry?: () => void; onGoBack?: () => void; onGoHome?: () => void }
): React.ReactElement {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return <NetworkError onRetry={options.onRetry} />
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return <UnauthorizedError onGoHome={options.onGoHome} />
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return <ForbiddenError onGoBack={options.onGoBack} />
    }
    if (message.includes('404') || message.includes('not found')) {
      return <NotFoundError onGoHome={options.onGoHome} />
    }
    if (message.includes('timeout')) {
      return <TimeoutError onRetry={options.onRetry} />
    }
    if (message.includes('500') || message.includes('server')) {
      return <ServerError onRetry={options.onRetry} />
    }
  }

  return <ErrorState onRetry={options.onRetry} onGoHome={options.onGoHome} />
}

export default ErrorState
