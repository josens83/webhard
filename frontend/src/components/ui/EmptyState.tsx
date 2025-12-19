import React from 'react'

/**
 * EmptyState 컴포넌트
 *
 * @description 데이터가 없을 때 표시하는 UI. "2 parts instruction + 1 part delight" 공식 적용.
 *
 * @example
 * // 기본 사용
 * <EmptyState
 *   icon={<FolderIcon />}
 *   title="폴더가 비어있습니다"
 *   description="파일을 업로드하거나 새 폴더를 만들어보세요."
 *   action={{
 *     label: "파일 업로드",
 *     onClick: () => handleUpload()
 *   }}
 * />
 *
 * @example
 * // 검색 결과 없음
 * <EmptyState
 *   icon={<SearchIcon />}
 *   title="검색 결과가 없습니다"
 *   description={`"${query}"에 대한 결과를 찾을 수 없습니다.`}
 *   action={{
 *     label: "검색 초기화",
 *     onClick: () => clearSearch()
 *   }}
 * />
 */

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* 아이콘 */}
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          {icon}
        </div>
      )}

      {/* 제목 */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>

      {/* 설명 */}
      <p className="mt-1 max-w-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>

      {/* 액션 버튼들 */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// Pre-built Empty State Variants
// ============================================

/**
 * 파일 없음 Empty State
 */
export function EmptyFiles({
  onUpload,
  onCreateFolder,
}: {
  onUpload?: () => void
  onCreateFolder?: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      }
      title="폴더가 비어있습니다"
      description="파일을 업로드하거나 새 폴더를 만들어 시작하세요."
      action={onUpload ? { label: "파일 업로드", onClick: onUpload } : undefined}
      secondaryAction={onCreateFolder ? { label: "새 폴더", onClick: onCreateFolder } : undefined}
    />
  )
}

/**
 * 검색 결과 없음 Empty State
 */
export function EmptySearch({
  query,
  onClear,
}: {
  query: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="검색 결과가 없습니다"
      description={`"${query}"에 대한 결과를 찾을 수 없습니다. 다른 키워드로 검색해보세요.`}
      action={onClear ? { label: "검색 초기화", onClick: onClear } : undefined}
    />
  )
}

/**
 * 알림 없음 Empty State
 */
export function EmptyNotifications() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      }
      title="새로운 알림이 없습니다"
      description="모든 알림을 확인했습니다."
    />
  )
}

/**
 * 메시지 없음 Empty State
 */
export function EmptyMessages({
  onStartChat,
}: {
  onStartChat?: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
      title="메시지가 없습니다"
      description="친구와 대화를 시작해보세요."
      action={onStartChat ? { label: "대화 시작하기", onClick: onStartChat } : undefined}
    />
  )
}

/**
 * 친구 없음 Empty State
 */
export function EmptyFriends({
  onInvite,
}: {
  onInvite?: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
      title="아직 친구가 없습니다"
      description="친구를 초대하여 파일을 공유해보세요."
      action={onInvite ? { label: "친구 초대하기", onClick: onInvite } : undefined}
    />
  )
}

export default EmptyState
