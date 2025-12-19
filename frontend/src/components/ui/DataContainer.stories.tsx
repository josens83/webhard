import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import {
  DataContainer,
  ListContainer,
  createIdleState,
  createLoadingState,
  createSuccessState,
  createErrorState,
  createEmptyState,
} from './DataContainer'
import type { DataState } from './DataContainer'

/**
 * DataContainer는 데이터 페칭의 모든 상태(로딩, 성공, 빈 상태, 에러)를 통합 관리합니다.
 * 일관된 UI/UX를 제공하며, 각 상태별 커스텀 렌더링을 지원합니다.
 */
const meta: Meta<typeof DataContainer> = {
  title: 'UI/DataContainer',
  component: DataContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '데이터 상태를 통합 관리하는 컨테이너 컴포넌트입니다.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DataContainer>

// 예시 데이터 타입
interface User {
  id: number
  name: string
  email: string
}

// 예시 데이터
const sampleUsers: User[] = [
  { id: 1, name: '홍길동', email: 'hong@example.com' },
  { id: 2, name: '김철수', email: 'kim@example.com' },
  { id: 3, name: '이영희', email: 'lee@example.com' },
]

/**
 * 로딩 상태 - 기본 스켈레톤 표시
 */
export const Loading: Story = {
  args: {
    state: createLoadingState<User[]>(),
    renderSuccess: (data) => (
      <div>
        {data.map((user) => (
          <div key={user.id}>{user.name}</div>
        ))}
      </div>
    ),
  },
}

/**
 * 성공 상태 - 데이터 표시
 */
export const Success: Story = {
  args: {
    state: createSuccessState(sampleUsers),
    renderSuccess: (data) => (
      <div className="space-y-2">
        {data.map((user) => (
          <div
            key={user.id}
            className="p-4 border rounded-lg bg-white dark:bg-gray-800"
          >
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        ))}
      </div>
    ),
  },
}

/**
 * 빈 상태 - 기본 EmptyState 표시
 */
export const Empty: Story = {
  args: {
    state: createEmptyState<User[]>(),
    renderSuccess: (data) => (
      <div>
        {data.map((user) => (
          <div key={user.id}>{user.name}</div>
        ))}
      </div>
    ),
    emptyTitle: '사용자가 없습니다',
    emptyDescription: '아직 등록된 사용자가 없습니다.',
    emptyAction: {
      label: '사용자 추가',
      onClick: () => alert('사용자 추가'),
    },
  },
}

/**
 * 에러 상태 - ErrorState 표시
 */
export const Error: Story = {
  args: {
    state: createErrorState<User[]>(new Error('서버에 연결할 수 없습니다.')),
    onRetry: () => alert('다시 시도'),
    renderSuccess: (data) => (
      <div>
        {data.map((user) => (
          <div key={user.id}>{user.name}</div>
        ))}
      </div>
    ),
  },
}

/**
 * 대기(Idle) 상태 - 로딩 스켈레톤과 동일하게 표시
 */
export const Idle: Story = {
  args: {
    state: createIdleState<User[]>(),
    renderSuccess: (data) => (
      <div>
        {data.map((user) => (
          <div key={user.id}>{user.name}</div>
        ))}
      </div>
    ),
  },
}

/**
 * 인터랙티브 데모 - 상태 전환 테스트
 */
export const Interactive: Story = {
  render: function InteractiveDemo() {
    const [state, setState] = useState<DataState<User[]>>(
      createIdleState<User[]>()
    )

    const handleFetch = () => {
      setState(createLoadingState())
      setTimeout(() => {
        setState(createSuccessState(sampleUsers))
      }, 1500)
    }

    const handleError = () => {
      setState(createLoadingState())
      setTimeout(() => {
        setState(createErrorState(new Error('네트워크 오류')))
      }, 1000)
    }

    const handleEmpty = () => {
      setState(createLoadingState())
      setTimeout(() => {
        setState(createEmptyState())
      }, 1000)
    }

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            데이터 불러오기
          </button>
          <button
            onClick={handleError}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            에러 발생
          </button>
          <button
            onClick={handleEmpty}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            빈 데이터
          </button>
        </div>

        <div className="border rounded-lg p-4 min-h-[200px]">
          <DataContainer
            state={state}
            onRetry={handleFetch}
            emptyTitle="사용자가 없습니다"
            emptyDescription="버튼을 클릭하여 데이터를 불러와보세요."
            renderSuccess={(data) => (
              <div className="space-y-2">
                {data.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 border rounded-lg bg-white dark:bg-gray-800"
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                ))}
              </div>
            )}
          />
        </div>
      </div>
    )
  },
}

/**
 * ListContainer - 리스트 전용 컨테이너
 */
export const List: Story = {
  render: () => (
    <div className="max-w-md">
      <ListContainer
        items={sampleUsers}
        isLoading={false}
        error={null}
        onRetry={() => alert('재시도')}
        renderItem={(user) => (
          <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        )}
        keyExtractor={(user) => user.id}
        emptyTitle="사용자가 없습니다"
        emptyDescription="아직 등록된 사용자가 없습니다."
      />
    </div>
  ),
}

/**
 * ListContainer 로딩 상태
 */
export const ListLoading: Story = {
  render: () => (
    <div className="max-w-md">
      <ListContainer
        items={[]}
        isLoading={true}
        error={null}
        renderItem={(user: User) => (
          <div className="p-4 border rounded-lg">
            <p className="font-medium">{user.name}</p>
          </div>
        )}
      />
    </div>
  ),
}

/**
 * ListContainer 빈 상태
 */
export const ListEmpty: Story = {
  render: () => (
    <div className="max-w-md">
      <ListContainer
        items={[]}
        isLoading={false}
        error={null}
        renderItem={(user: User) => (
          <div className="p-4 border rounded-lg">
            <p className="font-medium">{user.name}</p>
          </div>
        )}
        emptyTitle="검색 결과가 없습니다"
        emptyDescription="다른 키워드로 검색해보세요."
        emptyAction={{
          label: '검색 초기화',
          onClick: () => alert('검색 초기화'),
        }}
      />
    </div>
  ),
}
