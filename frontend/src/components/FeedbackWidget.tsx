/**
 * 피드백 위젯 컴포넌트 (Chapter 20)
 *
 * 인앱 사용자 피드백 수집용 플로팅 위젯
 * - 버그 리포트
 * - 기능 요청
 * - 일반 피드백
 */

'use client'

import { useState, useCallback } from 'react'
import { MessageSquare, X, Bug, Lightbulb, ThumbsUp, Send, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// 피드백 타입
type FeedbackType = 'bug' | 'feature' | 'general'

interface FeedbackWidgetProps {
  /** 피드백 제출 핸들러 */
  onSubmit?: (feedback: FeedbackPayload) => Promise<void>
  /** 위젯 위치 */
  position?: 'bottom-right' | 'bottom-left'
  /** 커스텀 클래스 */
  className?: string
}

interface FeedbackPayload {
  type: FeedbackType
  message: string
  page: string
  userAgent: string
  timestamp: string
  screenSize: string
}

const feedbackTypes = [
  { id: 'bug' as const, label: '버그 신고', icon: Bug, color: 'text-red-500' },
  { id: 'feature' as const, label: '기능 요청', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'general' as const, label: '일반 피드백', icon: ThumbsUp, color: 'text-blue-500' },
]

/**
 * 피드백 위젯
 *
 * @example
 * // 기본 사용 (콘솔 로그)
 * <FeedbackWidget />
 *
 * // 커스텀 제출 핸들러
 * <FeedbackWidget
 *   onSubmit={async (feedback) => {
 *     await fetch('/api/feedback', {
 *       method: 'POST',
 *       body: JSON.stringify(feedback),
 *     })
 *   }}
 * />
 */
export function FeedbackWidget({
  onSubmit,
  position = 'bottom-right',
  className,
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'type' | 'message' | 'success'>('type')
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  const handleTypeSelect = (type: FeedbackType) => {
    setSelectedType(type)
    setStep('message')
  }

  const handleSubmit = useCallback(async () => {
    if (!selectedType || !message.trim()) return

    setIsSubmitting(true)

    const payload: FeedbackPayload = {
      type: selectedType,
      message: message.trim(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      screenSize: typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight}`
        : '',
    }

    try {
      if (onSubmit) {
        await onSubmit(payload)
      } else {
        // 기본: 콘솔 로그 (개발용)
        // eslint-disable-next-line no-console
        console.log('[Feedback]', payload)
      }
      setStep('success')
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('피드백 제출 실패:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedType, message, onSubmit])

  const handleClose = () => {
    setIsOpen(false)
    // 닫힐 때 상태 초기화
    setTimeout(() => {
      setStep('type')
      setSelectedType(null)
      setMessage('')
    }, 200)
  }

  const handleBack = () => {
    if (step === 'message') {
      setStep('type')
      setSelectedType(null)
    }
  }

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-transform',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          positionClasses[position],
          isOpen && 'hidden',
          className
        )}
        aria-label="피드백 보내기"
        aria-expanded={isOpen}
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* 피드백 폼 */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 w-80 bg-background border rounded-lg shadow-xl',
            'animate-scale-in',
            position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {step === 'message' && (
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  aria-label="뒤로"
                >
                  ←
                </button>
              )}
              <h3 id="feedback-title" className="font-semibold">
                {step === 'type' && '피드백 종류 선택'}
                {step === 'message' && '피드백 작성'}
                {step === 'success' && '감사합니다!'}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 콘텐츠 */}
          <div className="p-4">
            {/* 타입 선택 */}
            {step === 'type' && (
              <div className="space-y-2">
                {feedbackTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border',
                      'hover:bg-muted transition-colors text-left'
                    )}
                  >
                    <type.icon className={cn('h-5 w-5', type.color)} />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 메시지 입력 */}
            {step === 'message' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="feedback-message" className="sr-only">
                    피드백 내용
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      selectedType === 'bug'
                        ? '어떤 문제가 발생했나요? 재현 방법을 알려주세요.'
                        : selectedType === 'feature'
                        ? '어떤 기능이 있으면 좋겠나요?'
                        : '개선 아이디어나 의견을 알려주세요.'
                    }
                    rows={4}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-primary',
                      'placeholder:text-muted-foreground'
                    )}
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2 rounded-lg',
                    'bg-primary text-primary-foreground font-medium',
                    'hover:bg-primary/90 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      보내는 중...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      보내기
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 성공 메시지 */}
            {step === 'success' && (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-medium">피드백이 전송되었습니다!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  소중한 의견 감사합니다.
                </p>
              </div>
            )}
          </div>

          {/* 푸터 - 현재 페이지 정보 */}
          {step !== 'success' && (
            <div className="px-4 py-2 border-t bg-muted/50">
              <p className="text-xs text-muted-foreground truncate">
                📍 {typeof window !== 'undefined' ? window.location.pathname : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 배경 오버레이 (모바일) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default FeedbackWidget
