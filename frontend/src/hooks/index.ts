/**
 * Hooks Index
 *
 * Centralized exports for all custom hooks.
 * Import from "@/hooks" instead of individual files.
 */

// Socket Hook
export { useSocket } from './useSocket'

// Accessibility Hooks
export {
  useReducedMotion,
  useFocusTrap,
  useEscapeKey,
  useArrowNavigation,
  useAnnounce,
  useClickOutside,
  usePreviousFocus,
  useTypeahead,
  srOnly,
} from './useAccessibility'
