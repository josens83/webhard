import React from 'react'
import { Skeleton, CardSkeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

/**
 * DataContainer 컴포넌트
 *
 * @description 데이터 페칭의 모든 상태(로딩, 성공, 빈 상태, 에러)를 통합 관리하는 컨테이너.
 *
 * @example
 * // 기본 사용
 * <DataContainer
 *   state={dataState}
 *   onRetry={fetchData}
 *   renderSuccess={(data) => <UserList users={data} />}
 * />
 *
 * @example
 * // 커스텀 상태 렌더링
 * <DataContainer
 *   state={dataState}
 *   onRetry={fetchData}
 *   renderLoading={() => <CustomSkeleton />}
 *   renderEmpty={() => <CustomEmptyState />}
 *   renderError={(error) => <CustomErrorState error={error} />}
 *   renderSuccess={(data) => <DataList items={data} />}
 * />
 */

// 데이터 상태 타입 정의
export type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
  | { status: 'empty' }

// DataContainer Props
interface DataContainerProps<T> {
  state: DataState<T>
  onRetry?: () => void

  // 각 상태별 커스텀 렌더링 (선택)
  renderLoading?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderError?: (error: Error) => React.ReactNode
  renderSuccess: (data: T) => React.ReactNode

  // Empty State 커스터마이징
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: {
    label: string
    onClick: () => void
  }

  className?: string
}

export function DataContainer<T>({
  state,
  onRetry,
  renderLoading,
  renderEmpty,
  renderError,
  renderSuccess,
  emptyIcon,
  emptyTitle = '데이터가 없습니다',
  emptyDescription = '표시할 내용이 없습니다.',
  emptyAction,
  className = '',
}: DataContainerProps<T>) {
  switch (state.status) {
    case 'idle':
    case 'loading':
      return (
        <div className={className}>
          {renderLoading?.() ?? <DefaultLoadingSkeleton />}
        </div>
      )

    case 'empty':
      return (
        <div className={className}>
          {renderEmpty?.() ?? (
            <EmptyState
              icon={emptyIcon ?? <DefaultEmptyIcon />}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          )}
        </div>
      )

    case 'error':
      return (
        <div className={className}>
          {renderError?.(state.error) ?? (
            <ErrorState
              message={state.error.message}
              onRetry={onRetry}
            />
          )}
        </div>
      )

    case 'success':
      return <div className={className}>{renderSuccess(state.data)}</div>

    default:
      return null
  }
}

// 기본 로딩 스켈레톤
function DefaultLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// 기본 빈 상태 아이콘
function DefaultEmptyIcon() {
  return (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}

// ============================================
// 상태 생성 헬퍼 함수
// ============================================

export const createIdleState = <T>(): DataState<T> => ({ status: 'idle' })
export const createLoadingState = <T>(): DataState<T> => ({ status: 'loading' })
export const createSuccessState = <T>(data: T): DataState<T> => ({ status: 'success', data })
export const createErrorState = <T>(error: Error): DataState<T> => ({ status: 'error', error })
export const createEmptyState = <T>(): DataState<T> => ({ status: 'empty' })

/**
 * 데이터 페칭 결과를 DataState로 변환
 */
export function toDataState<T>(
  data: T | null | undefined,
  isLoading: boolean,
  error: Error | null
): DataState<T> {
  if (isLoading) {
    return createLoadingState()
  }

  if (error) {
    return createErrorState(error)
  }

  if (data === null || data === undefined) {
    return createEmptyState()
  }

  // 배열인 경우 빈 배열 체크
  if (Array.isArray(data) && data.length === 0) {
    return createEmptyState()
  }

  return createSuccessState(data)
}

// ============================================
// React Hook for DataState Management
// ============================================

import { useState, useCallback } from 'react'

/**
 * 데이터 상태 관리 훅
 *
 * @example
 * const { state, setLoading, setSuccess, setError, setEmpty, reset } = useDataState<User[]>()
 *
 * const fetchUsers = async () => {
 *   setLoading()
 *   try {
 *     const users = await api.getUsers()
 *     if (users.length === 0) {
 *       setEmpty()
 *     } else {
 *       setSuccess(users)
 *     }
 *   } catch (error) {
 *     setError(error as Error)
 *   }
 * }
 */
export function useDataState<T>(initialState: DataState<T> = { status: 'idle' }) {
  const [state, setState] = useState<DataState<T>>(initialState)

  const setIdle = useCallback(() => setState({ status: 'idle' }), [])
  const setLoading = useCallback(() => setState({ status: 'loading' }), [])
  const setSuccess = useCallback((data: T) => setState({ status: 'success', data }), [])
  const setError = useCallback((error: Error) => setState({ status: 'error', error }), [])
  const setEmpty = useCallback(() => setState({ status: 'empty' }), [])
  const reset = useCallback(() => setState(initialState), [initialState])

  return {
    state,
    setIdle,
    setLoading,
    setSuccess,
    setError,
    setEmpty,
    reset,
    // 편의 속성
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    isEmpty: state.status === 'empty',
    data: state.status === 'success' ? state.data : undefined,
    error: state.status === 'error' ? state.error : undefined,
  }
}

// ============================================
// List-specific DataContainer
// ============================================

interface ListContainerProps<T> {
  items: T[]
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
  renderItem: (item: T, index: number) => React.ReactNode
  renderLoading?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderError?: (error: Error) => React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
  keyExtractor?: (item: T, index: number) => string | number
  className?: string
  listClassName?: string
}

/**
 * 리스트 전용 DataContainer
 *
 * @example
 * <ListContainer
 *   items={users}
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   renderItem={(user) => <UserCard user={user} />}
 *   emptyTitle="사용자가 없습니다"
 *   keyExtractor={(user) => user.id}
 * />
 */
export function ListContainer<T>({
  items,
  isLoading,
  error,
  onRetry,
  renderItem,
  renderLoading,
  renderEmpty,
  renderError,
  emptyTitle = '항목이 없습니다',
  emptyDescription = '표시할 항목이 없습니다.',
  emptyAction,
  keyExtractor,
  className = '',
  listClassName = 'space-y-4',
}: ListContainerProps<T>) {
  const state = toDataState(items, isLoading, error)

  return (
    <DataContainer
      state={state}
      onRetry={onRetry}
      className={className}
      renderLoading={renderLoading}
      renderEmpty={renderEmpty}
      renderError={renderError}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      renderSuccess={(data) => (
        <div className={listClassName}>
          {data.map((item, index) => (
            <React.Fragment key={keyExtractor?.(item, index) ?? index}>
              {renderItem(item, index)}
            </React.Fragment>
          ))}
        </div>
      )}
    />
  )
}

export default DataContainer
