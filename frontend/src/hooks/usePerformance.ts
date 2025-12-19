/**
 * 성능 모니터링 훅 (Chapter 18)
 *
 * Core Web Vitals 측정 및 리포팅
 * - LCP (Largest Contentful Paint): ≤ 2.5초
 * - INP (Interaction to Next Paint): ≤ 200ms
 * - CLS (Cumulative Layout Shift): ≤ 0.1
 */

import { useCallback, useEffect, useRef } from 'react'

// Web Vitals 메트릭 타입
interface WebVitalMetric {
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

// 임계값 정의
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
}

/**
 * 메트릭 등급 계산
 */
function getRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Web Vitals 측정 및 리포팅 훅
 *
 * @example
 * // 기본 사용
 * useWebVitals()
 *
 * // 커스텀 리포터
 * useWebVitals((metric) => {
 *   sendToAnalytics(metric)
 * })
 */
export function useWebVitals(
  onReport?: (metric: WebVitalMetric) => void
) {
  useEffect(() => {
    // Performance Observer가 지원되지 않으면 종료
    if (typeof PerformanceObserver === 'undefined') return

    const observers: PerformanceObserver[] = []

    // LCP 측정
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          const value = lastEntry.startTime
          const metric: WebVitalMetric = {
            name: 'LCP',
            value,
            rating: getRating('LCP', value),
            delta: value,
            id: `lcp-${Date.now()}`,
            navigationType: 'navigate',
          }
          onReport?.(metric)
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Web Vitals] LCP: ${value.toFixed(0)}ms (${metric.rating})`)
          }
        }
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      observers.push(lcpObserver)
    } catch {
      // LCP not supported
    }

    // CLS 측정
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // @ts-expect-error hadRecentInput is not in types
          if (!entry.hadRecentInput) {
            // @ts-expect-error value is not in types
            clsValue += entry.value
          }
        }
        const metric: WebVitalMetric = {
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          delta: clsValue,
          id: `cls-${Date.now()}`,
          navigationType: 'navigate',
        }
        onReport?.(metric)
        // eslint-disable-next-line no-console
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Web Vitals] CLS: ${clsValue.toFixed(3)} (${metric.rating})`)
        }
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      observers.push(clsObserver)
    } catch {
      // CLS not supported
    }

    // FCP 측정
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint')
        if (fcpEntry) {
          const value = fcpEntry.startTime
          const metric: WebVitalMetric = {
            name: 'FCP',
            value,
            rating: getRating('FCP', value),
            delta: value,
            id: `fcp-${Date.now()}`,
            navigationType: 'navigate',
          }
          onReport?.(metric)
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Web Vitals] FCP: ${value.toFixed(0)}ms (${metric.rating})`)
          }
        }
      })
      fcpObserver.observe({ type: 'paint', buffered: true })
      observers.push(fcpObserver)
    } catch {
      // FCP not supported
    }

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [onReport])
}

/**
 * 컴포넌트 렌더링 시간 측정 훅
 *
 * @example
 * const renderTime = useRenderTime('ProductList')
 * // 렌더링 후 renderTime.current에 시간 저장됨
 */
export function useRenderTime(componentName: string) {
  const startTime = useRef(performance.now())
  const renderTime = useRef(0)

  useEffect(() => {
    renderTime.current = performance.now() - startTime.current
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development' && renderTime.current > 16) {
      console.warn(
        `[Performance] ${componentName} 렌더링이 ${renderTime.current.toFixed(1)}ms 걸렸습니다 (목표: <16ms)`
      )
    }
  })

  return renderTime
}

/**
 * 지연 로딩 표시기 - 100ms 이후에만 스피너 표시
 *
 * @example
 * const showSpinner = useDelayedLoading(isLoading, 100)
 * {showSpinner && <Spinner />}
 */
export function useDelayedLoading(isLoading: boolean, delayMs: number = 100) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoading(true), delayMs)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
    }
  }, [isLoading, delayMs])

  return showLoading
}

// useState import 필요
import { useState } from 'react'

/**
 * 프리페치 훅 - 링크 호버 시 페이지 프리로드
 *
 * @example
 * const prefetch = usePrefetch()
 * <Link onMouseEnter={() => prefetch('/product/123')} href="/product/123">
 */
export function usePrefetch() {
  const prefetchedUrls = useRef(new Set<string>())

  const prefetch = useCallback((url: string) => {
    if (prefetchedUrls.current.has(url)) return

    // 이미지 프리로드
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
      const img = new Image()
      img.src = url
    }

    prefetchedUrls.current.add(url)
  }, [])

  return prefetch
}

/**
 * 무거운 작업 분리 훅 - 메인 스레드 블로킹 방지
 *
 * @example
 * const deferredCompute = useDeferredComputation()
 * const result = await deferredCompute(() => heavyCalculation())
 */
export function useDeferredComputation() {
  const deferComputation = useCallback(
    <T>(computation: () => T): Promise<T> => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            resolve(computation())
          }, 0)
        })
      })
    },
    []
  )

  return deferComputation
}

/**
 * 이미지 프리로드 훅 - 갤러리 등에서 다음 이미지 미리 로드
 *
 * @example
 * useImagePreload(images, currentIndex, { preloadCount: 2 })
 */
export function useImagePreload(
  images: string[],
  currentIndex: number,
  options: { preloadCount?: number } = {}
) {
  const { preloadCount = 1 } = options

  useEffect(() => {
    const imagesToPreload: string[] = []

    // 다음 이미지들 프리로드
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i
      if (nextIndex < images.length) {
        imagesToPreload.push(images[nextIndex] as string)
      }
    }

    // 이전 이미지도 프리로드
    for (let i = 1; i <= preloadCount; i++) {
      const prevIndex = currentIndex - i
      if (prevIndex >= 0) {
        imagesToPreload.push(images[prevIndex] as string)
      }
    }

    // 프리로드 실행
    imagesToPreload.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [images, currentIndex, preloadCount])
}

export default {
  useWebVitals,
  useRenderTime,
  useDelayedLoading,
  usePrefetch,
  useDeferredComputation,
  useImagePreload,
}
