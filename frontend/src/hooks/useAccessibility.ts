/**
 * 접근성(A11y) 커스텀 훅 모음 (Chapter 17)
 *
 * @description 키보드 네비게이션, 포커스 관리, 모션 감소 등 접근성 기능 제공
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 모션 감소 설정 감지 훅
 *
 * @example
 * const prefersReducedMotion = useReducedMotion()
 * const duration = prefersReducedMotion ? 0 : 300
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * 포커스 트랩 훅 - 모달, 드롭다운 등에서 포커스가 벗어나지 않도록 함
 *
 * @example
 * const modalRef = useRef<HTMLDivElement>(null)
 * useFocusTrap(modalRef, isOpen)
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // 첫 번째 요소로 포커스 이동
    firstElement?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab: 첫 번째 요소에서 마지막으로 이동
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: 마지막 요소에서 첫 번째로 이동
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [containerRef, isActive])
}

/**
 * Escape 키 핸들러 훅
 *
 * @example
 * useEscapeKey(() => closeModal(), isOpen)
 */
export function useEscapeKey(
  onEscape: () => void,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscape, isActive])
}

/**
 * 화살표 키 네비게이션 훅 - 리스트, 메뉴 등에서 사용
 *
 * @example
 * const { focusedIndex, setFocusedIndex, handleKeyDown } = useArrowNavigation(items.length)
 */
export function useArrowNavigation(
  itemCount: number,
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical' | 'both'
    initialIndex?: number
    onSelect?: (index: number) => void
  } = {}
) {
  const {
    loop = true,
    orientation = 'vertical',
    initialIndex = 0,
    onSelect,
  } = options

  const [focusedIndex, setFocusedIndex] = useState(initialIndex)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let newIndex = focusedIndex

      const isVertical = orientation === 'vertical' || orientation === 'both'
      const isHorizontal = orientation === 'horizontal' || orientation === 'both'

      switch (event.key) {
        case 'ArrowDown':
          if (isVertical) {
            event.preventDefault()
            newIndex = loop
              ? (focusedIndex + 1) % itemCount
              : Math.min(focusedIndex + 1, itemCount - 1)
          }
          break

        case 'ArrowUp':
          if (isVertical) {
            event.preventDefault()
            newIndex = loop
              ? (focusedIndex - 1 + itemCount) % itemCount
              : Math.max(focusedIndex - 1, 0)
          }
          break

        case 'ArrowRight':
          if (isHorizontal) {
            event.preventDefault()
            newIndex = loop
              ? (focusedIndex + 1) % itemCount
              : Math.min(focusedIndex + 1, itemCount - 1)
          }
          break

        case 'ArrowLeft':
          if (isHorizontal) {
            event.preventDefault()
            newIndex = loop
              ? (focusedIndex - 1 + itemCount) % itemCount
              : Math.max(focusedIndex - 1, 0)
          }
          break

        case 'Home':
          event.preventDefault()
          newIndex = 0
          break

        case 'End':
          event.preventDefault()
          newIndex = itemCount - 1
          break

        case 'Enter':
        case ' ':
          event.preventDefault()
          onSelect?.(focusedIndex)
          return

        default:
          return
      }

      setFocusedIndex(newIndex)
    },
    [focusedIndex, itemCount, loop, orientation, onSelect]
  )

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
  }
}

/**
 * 라이브 리전 알림 훅 - 스크린 리더에 동적 변경 알림
 *
 * @example
 * const announce = useAnnounce()
 * announce('파일이 업로드되었습니다', 'polite')
 */
export function useAnnounce() {
  const announceRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // 라이브 리전 요소 생성
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
    announceRef.current = announcer

    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current)
      }
    }
  }, [])

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!announceRef.current) return

      announceRef.current.setAttribute('aria-live', priority)
      announceRef.current.textContent = ''

      // 스크린 리더가 변경을 감지하도록 잠시 대기
      requestAnimationFrame(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message
        }
      })
    },
    []
  )

  return announce
}

/**
 * 클릭 외부 감지 훅 - 드롭다운, 모달 닫기용
 *
 * @example
 * const dropdownRef = useRef<HTMLDivElement>(null)
 * useClickOutside(dropdownRef, () => setIsOpen(false))
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  onClickOutside: () => void
) {
  useEffect(() => {
    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside()
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [ref, onClickOutside])
}

/**
 * 이전 포커스 복원 훅 - 모달 닫을 때 원래 위치로 포커스 복원
 *
 * @example
 * const restoreFocus = usePreviousFocus(isModalOpen)
 * // 모달 닫을 때: restoreFocus()
 */
export function usePreviousFocus(isActive: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isActive) {
      // 현재 포커스된 요소 저장
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isActive])

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus()
    }
  }, [])

  return restoreFocus
}

/**
 * 타입어헤드 검색 훅 - 리스트에서 타이핑으로 검색
 *
 * @example
 * const { query, handleKeyDown } = useTypeahead(items, (index) => setFocusedIndex(index))
 */
export function useTypeahead<T>(
  items: T[],
  onMatch: (index: number) => void,
  getItemText: (item: T) => string = (item) => String(item)
) {
  const [query, setQuery] = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // 특수 키는 무시
      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      const newQuery = query + event.key.toLowerCase()
      setQuery(newQuery)

      // 매칭되는 항목 찾기
      const matchIndex = items.findIndex((item) =>
        getItemText(item).toLowerCase().startsWith(newQuery)
      )

      if (matchIndex !== -1) {
        onMatch(matchIndex)
      }

      // 이전 타임아웃 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 500ms 후 쿼리 리셋
      timeoutRef.current = setTimeout(() => {
        setQuery('')
      }, 500)
    },
    [query, items, onMatch, getItemText]
  )

  return { query, handleKeyDown }
}

/**
 * 스크린 리더 전용 텍스트 컴포넌트 props 생성
 *
 * @example
 * <span {...srOnly}>스크린 리더 전용 텍스트</span>
 */
export const srOnly = {
  className: 'sr-only',
} as const

export default {
  useReducedMotion,
  useFocusTrap,
  useEscapeKey,
  useArrowNavigation,
  useAnnounce,
  useClickOutside,
  usePreviousFocus,
  useTypeahead,
  srOnly,
}
