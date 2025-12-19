import React from 'react'

/**
 * Skeleton 컴포넌트
 *
 * @description 로딩 상태 표시용 플레이스홀더. Spinner 대신 사용 권장.
 *
 * @example
 * // 기본 사용
 * <Skeleton className="h-4 w-full" />
 *
 * @example
 * // 아바타
 * <Skeleton className="h-12 w-12 rounded-full" />
 *
 * @example
 * // 카드 스켈레톤
 * <CardSkeleton />
 *
 * @example
 * // 리스트 아이템
 * <ListItemSkeleton />
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
      {...props}
    />
  )
}

/**
 * 카드 형태의 Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* 이미지 영역 */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* 제목 */}
      <Skeleton className="mt-4 h-6 w-3/4" />

      {/* 설명 2줄 */}
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />

      {/* 버튼 영역 */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

/**
 * 리스트 아이템 형태의 Skeleton
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-gray-200 p-4 dark:border-gray-700">
      {/* 아바타 */}
      <Skeleton className="h-12 w-12 rounded-full" />

      <div className="flex-1 space-y-2">
        {/* 이름 */}
        <Skeleton className="h-4 w-1/3" />
        {/* 설명 */}
        <Skeleton className="h-3 w-1/2" />
      </div>

      {/* 액션 버튼 */}
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  )
}

/**
 * 테이블 형태의 Skeleton
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex gap-4 border-b border-gray-200 p-4 dark:border-gray-700">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>

      {/* 행들 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-gray-200 p-4 dark:border-gray-700">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  )
}

/**
 * 파일 리스트 아이템 Skeleton (EduVault 전용)
 */
export function FileItemSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      {/* 파일 아이콘 */}
      <Skeleton className="h-10 w-10 rounded" />

      <div className="flex-1 space-y-2">
        {/* 파일명 */}
        <Skeleton className="h-4 w-2/3" />
        {/* 파일 정보 */}
        <Skeleton className="h-3 w-1/3" />
      </div>

      {/* 액션 버튼들 */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )
}

/**
 * 프로필 카드 Skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center p-6">
      {/* 아바타 */}
      <Skeleton className="h-24 w-24 rounded-full" />

      {/* 이름 */}
      <Skeleton className="mt-4 h-6 w-32" />

      {/* 이메일 */}
      <Skeleton className="mt-2 h-4 w-48" />

      {/* 통계 */}
      <div className="mt-6 flex gap-8">
        <div className="flex flex-col items-center">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="mt-1 h-3 w-16" />
        </div>
        <div className="flex flex-col items-center">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="mt-1 h-3 w-16" />
        </div>
        <div className="flex flex-col items-center">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="mt-1 h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export default Skeleton
