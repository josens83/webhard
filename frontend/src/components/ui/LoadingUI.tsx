/**
 * 로딩 UX 컴포넌트 (Chapter 18)
 *
 * 체감 성능(Perceived Performance) 최적화:
 * - 100ms 이전: 아무것도 표시 안 함
 * - 100ms-1초: 미묘한 인디케이터
 * - 1초-3초: Skeleton UI
 * - 3초+: 진행률 표시
 */

import React, { useState, useEffect, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// DelayedSpinner - 100ms 후에만 스피너 표시
// ============================================

interface DelayedSpinnerProps {
  /** 로딩 중 여부 */
  isLoading: boolean
  /** 스피너 표시까지 지연 시간 (기본: 100ms) */
  delay?: number
  /** 스피너 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 커스텀 클래스 */
  className?: string
  /** 스피너 대신 표시할 커스텀 컴포넌트 */
  children?: ReactNode
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

/**
 * 지연 스피너 - 깜빡임 방지
 *
 * @example
 * <DelayedSpinner isLoading={isLoading} delay={100}>
 *   <CustomLoadingAnimation />
 * </DelayedSpinner>
 */
export function DelayedSpinner({
  isLoading,
  delay = 100,
  size = 'md',
  className,
  children,
}: DelayedSpinnerProps) {
  const [showSpinner, setShowSpinner] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowSpinner(true), delay)
      return () => clearTimeout(timer)
    } else {
      setShowSpinner(false)
    }
  }, [isLoading, delay])

  if (!showSpinner) return null

  if (children) {
    return <>{children}</>
  }

  return (
    <Loader2
      className={cn(
        spinnerSizes[size],
        'animate-spin text-muted-foreground',
        className
      )}
    />
  )
}

// ============================================
// ButtonLoadingState - 버튼 내부 로딩 표시
// ============================================

interface ButtonLoadingStateProps {
  isLoading: boolean
  loadingText?: string
  children: ReactNode
}

/**
 * 버튼 로딩 상태 래퍼
 *
 * @example
 * <Button disabled={isLoading}>
 *   <ButtonLoadingState isLoading={isLoading} loadingText="저장 중...">
 *     저장
 *   </ButtonLoadingState>
 * </Button>
 */
export function ButtonLoadingState({
  isLoading,
  loadingText,
  children,
}: ButtonLoadingStateProps) {
  return (
    <span className="inline-flex items-center gap-2">
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? loadingText ?? children : children}
    </span>
  )
}

// ============================================
// ProgressLoader - 진행률 표시 (3초+ 작업용)
// ============================================

interface ProgressLoaderProps {
  /** 현재 진행률 (0-100) */
  progress: number
  /** 예상 남은 시간 (초) */
  estimatedTimeRemaining?: number
  /** 상태 메시지 */
  message?: string
  /** 커스텀 클래스 */
  className?: string
}

/**
 * 진행률 로더 - 긴 작업용
 *
 * @example
 * <ProgressLoader
 *   progress={75}
 *   estimatedTimeRemaining={30}
 *   message="파일 업로드 중..."
 * />
 */
export function ProgressLoader({
  progress,
  estimatedTimeRemaining,
  message,
  className,
}: ProgressLoaderProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `약 ${Math.ceil(seconds)}초`
    const minutes = Math.floor(seconds / 60)
    return `약 ${minutes}분`
  }

  return (
    <div className={cn('space-y-2', className)}>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{clampedProgress.toFixed(0)}%</span>
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
          <span>{formatTime(estimatedTimeRemaining)} 남음</span>
        )}
      </div>
    </div>
  )
}

// ============================================
// OptimisticWrapper - 낙관적 업데이트 래퍼
// ============================================

interface OptimisticWrapperProps<T> {
  /** 현재 값 */
  value: T
  /** 낙관적 값 (pending 상태의 예상 값) */
  optimisticValue: T
  /** pending 상태 여부 */
  isPending: boolean
  /** 렌더 함수 */
  children: (value: T, isPending: boolean) => ReactNode
}

/**
 * 낙관적 업데이트 래퍼
 *
 * @example
 * <OptimisticWrapper
 *   value={likes}
 *   optimisticValue={optimisticLikes}
 *   isPending={isPending}
 * >
 *   {(count, pending) => (
 *     <span style={{ opacity: pending ? 0.7 : 1 }}>{count}</span>
 *   )}
 * </OptimisticWrapper>
 */
export function OptimisticWrapper<T>({
  value,
  optimisticValue,
  isPending,
  children,
}: OptimisticWrapperProps<T>) {
  const displayValue = isPending ? optimisticValue : value
  return <>{children(displayValue, isPending)}</>
}

// ============================================
// PulseLoader - 부드러운 펄스 로딩
// ============================================

interface PulseLoaderProps {
  className?: string
}

/**
 * 펄스 로딩 인디케이터
 *
 * @example
 * <PulseLoader className="h-4 w-4" />
 */
export function PulseLoader({ className }: PulseLoaderProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary animate-pulse"
          style={{
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// FullPageLoader - 전체 페이지 로딩
// ============================================

interface FullPageLoaderProps {
  message?: string
}

/**
 * 전체 페이지 로딩 오버레이
 *
 * @example
 * {isPageLoading && <FullPageLoader message="페이지 로딩 중..." />}
 */
export function FullPageLoader({ message }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}

// ============================================
// InlineLoader - 인라인 로딩 표시
// ============================================

interface InlineLoaderProps {
  className?: string
}

/**
 * 인라인 로딩 (텍스트 옆에 표시)
 *
 * @example
 * <span>저장 중 <InlineLoader /></span>
 */
export function InlineLoader({ className }: InlineLoaderProps) {
  return (
    <Loader2
      className={cn('inline h-3 w-3 animate-spin ml-1', className)}
    />
  )
}

export default {
  DelayedSpinner,
  ButtonLoadingState,
  ProgressLoader,
  OptimisticWrapper,
  PulseLoader,
  FullPageLoader,
  InlineLoader,
}
