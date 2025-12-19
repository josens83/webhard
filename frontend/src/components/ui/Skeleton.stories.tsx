import type { Meta, StoryObj } from '@storybook/react'
import {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  TableSkeleton,
  FileItemSkeleton,
  ProfileSkeleton,
} from './Skeleton'

/**
 * Skeleton 컴포넌트는 콘텐츠가 로딩되는 동안 플레이스홀더를 표시합니다.
 * Spinner 대신 Skeleton을 사용하여 레이아웃 이동(Layout Shift)을 방지합니다.
 */
const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '로딩 상태 표시용 플레이스홀더 컴포넌트입니다.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Skeleton>

/**
 * 기본 Skeleton - 다양한 크기로 사용 가능
 */
export const Default: Story = {
  args: {
    className: 'h-4 w-full',
  },
}

/**
 * 텍스트 라인 Skeleton
 */
export const TextLines: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  ),
}

/**
 * 아바타 Skeleton
 */
export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ),
}

/**
 * 카드 Skeleton - 이미지 + 텍스트 + 버튼 조합
 */
export const Card: Story = {
  render: () => <CardSkeleton />,
}

/**
 * 리스트 아이템 Skeleton
 */
export const ListItem: Story = {
  render: () => (
    <div className="max-w-md">
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
    </div>
  ),
}

/**
 * 테이블 Skeleton - 기본 5행
 */
export const Table: Story = {
  render: () => <TableSkeleton rows={5} />,
}

/**
 * 파일 아이템 Skeleton - EduVault 파일 목록용
 */
export const FileItem: Story = {
  render: () => (
    <div className="space-y-4 max-w-lg">
      <FileItemSkeleton />
      <FileItemSkeleton />
      <FileItemSkeleton />
    </div>
  ),
}

/**
 * 프로필 카드 Skeleton
 */
export const Profile: Story = {
  render: () => (
    <div className="max-w-sm border rounded-lg">
      <ProfileSkeleton />
    </div>
  ),
}

/**
 * 그리드 레이아웃 Skeleton
 */
export const Grid: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  ),
}
