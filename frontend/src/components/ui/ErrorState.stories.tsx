import type { Meta, StoryObj } from '@storybook/react'
import {
  ErrorState,
  InlineError,
  NetworkError,
  ServerError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  TimeoutError,
} from './ErrorState'

/**
 * ErrorState 컴포넌트는 에러 발생 시 사용자에게 상황을 안내합니다.
 * 사용자에게 3가지를 알려줍니다:
 * 1. 무슨 문제가 발생했는지
 * 2. 왜 발생했는지 (가능하다면)
 * 3. 어떻게 해결할 수 있는지
 */
const meta: Meta<typeof ErrorState> = {
  title: 'UI/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '에러 발생 시 표시하는 UI 컴포넌트입니다.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    message: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof ErrorState>

/**
 * 기본 ErrorState - 재시도 버튼 포함
 */
export const Default: Story = {
  args: {
    title: '문제가 발생했습니다',
    message: '데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    onRetry: () => alert('다시 시도'),
  },
}

/**
 * 뒤로 가기 버튼 포함
 */
export const WithGoBack: Story = {
  args: {
    title: '접근할 수 없습니다',
    message: '이 페이지에 접근할 권한이 없습니다.',
    onGoBack: () => alert('뒤로 가기'),
  },
}

/**
 * 홈으로 가기 버튼 포함
 */
export const WithGoHome: Story = {
  args: {
    title: '페이지를 찾을 수 없습니다',
    message: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
    onGoHome: () => alert('홈으로 가기'),
  },
}

/**
 * 모든 액션 버튼 포함
 */
export const AllActions: Story = {
  args: {
    title: '오류가 발생했습니다',
    message: '예상치 못한 오류가 발생했습니다.',
    onRetry: () => alert('다시 시도'),
    onGoBack: () => alert('뒤로 가기'),
    onGoHome: () => alert('홈으로 가기'),
  },
}

/**
 * 인라인 에러 - 작은 영역용
 */
export const Inline: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <InlineError
        message="파일을 업로드할 수 없습니다."
        onRetry={() => alert('재시도')}
      />
      <InlineError message="네트워크 연결이 불안정합니다." />
    </div>
  ),
}

/**
 * 네트워크 에러 - Pre-built 컴포넌트
 */
export const Network: Story = {
  render: () => <NetworkError onRetry={() => alert('재시도')} />,
}

/**
 * 서버 에러 - Pre-built 컴포넌트
 */
export const Server: Story = {
  render: () => <ServerError onRetry={() => alert('재시도')} />,
}

/**
 * 인증 필요 에러 - Pre-built 컴포넌트
 */
export const Unauthorized: Story = {
  render: () => <UnauthorizedError onGoHome={() => alert('홈으로')} />,
}

/**
 * 접근 금지 에러 - Pre-built 컴포넌트
 */
export const Forbidden: Story = {
  render: () => <ForbiddenError onGoBack={() => alert('뒤로')} />,
}

/**
 * 404 Not Found - Pre-built 컴포넌트
 */
export const NotFound: Story = {
  render: () => <NotFoundError onGoHome={() => alert('홈으로')} />,
}

/**
 * 타임아웃 에러 - Pre-built 컴포넌트
 */
export const Timeout: Story = {
  render: () => <TimeoutError onRetry={() => alert('재시도')} />,
}
