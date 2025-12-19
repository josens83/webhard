/**
 * UI Components Index
 *
 * Centralized exports for all reusable UI components.
 * Import from "@/components/ui" instead of individual files.
 */

// Skeleton Components
export {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  TableSkeleton,
  FileItemSkeleton,
  ProfileSkeleton,
} from './Skeleton'

// Empty State Components
export {
  EmptyState,
  EmptyFiles,
  EmptySearch,
  EmptyNotifications,
  EmptyMessages,
  EmptyFriends,
} from './EmptyState'

// Error State Components
export {
  ErrorState,
  InlineError,
  NetworkError,
  ServerError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  TimeoutError,
  getErrorComponent,
} from './ErrorState'

// Data Container Components
export {
  DataContainer,
  ListContainer,
  useDataState,
  toDataState,
  createIdleState,
  createLoadingState,
  createSuccessState,
  createErrorState,
  createEmptyState,
} from './DataContainer'
export type { DataState } from './DataContainer'
