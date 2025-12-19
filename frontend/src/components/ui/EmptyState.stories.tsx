import type { Meta, StoryObj } from '@storybook/react'
import {
  EmptyState,
  EmptyFiles,
  EmptySearch,
  EmptyNotifications,
  EmptyMessages,
  EmptyFriends,
} from './EmptyState'

/**
 * EmptyState 컴포넌트는 데이터가 없을 때 사용자에게 상황을 안내합니다.
 * "2 parts instruction + 1 part delight" 공식을 적용합니다.
 */
const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '데이터가 없을 때 표시하는 빈 상태 UI 컴포넌트입니다.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof EmptyState>

/**
 * 기본 EmptyState
 */
export const Default: Story = {
  args: {
    title: '데이터가 없습니다',
    description: '표시할 내용이 없습니다. 새로운 항목을 추가해보세요.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    action: {
      label: '항목 추가',
      onClick: () => alert('항목 추가 클릭'),
    },
  },
}

/**
 * 액션 버튼 없는 EmptyState
 */
export const WithoutAction: Story = {
  args: {
    title: '알림이 없습니다',
    description: '새로운 알림이 도착하면 여기에 표시됩니다.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
}

/**
 * 두 개의 액션 버튼
 */
export const WithSecondaryAction: Story = {
  args: {
    title: '폴더가 비어있습니다',
    description: '파일을 업로드하거나 새 폴더를 만들어보세요.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    action: {
      label: '파일 업로드',
      onClick: () => alert('파일 업로드 클릭'),
    },
    secondaryAction: {
      label: '새 폴더',
      onClick: () => alert('새 폴더 클릭'),
    },
  },
}

/**
 * 파일 없음 - Pre-built 컴포넌트
 */
export const Files: Story = {
  render: () => (
    <EmptyFiles
      onUpload={() => alert('파일 업로드')}
      onCreateFolder={() => alert('새 폴더 만들기')}
    />
  ),
}

/**
 * 검색 결과 없음 - Pre-built 컴포넌트
 */
export const Search: Story = {
  render: () => (
    <EmptySearch
      query="테스트 검색어"
      onClear={() => alert('검색 초기화')}
    />
  ),
}

/**
 * 알림 없음 - Pre-built 컴포넌트
 */
export const Notifications: Story = {
  render: () => <EmptyNotifications />,
}

/**
 * 메시지 없음 - Pre-built 컴포넌트
 */
export const Messages: Story = {
  render: () => (
    <EmptyMessages onStartChat={() => alert('대화 시작')} />
  ),
}

/**
 * 친구 없음 - Pre-built 컴포넌트
 */
export const Friends: Story = {
  render: () => (
    <EmptyFriends onInvite={() => alert('친구 초대')} />
  ),
}
