// Component prop types for React components
import { MatchingResult } from './domain';

export interface DashboardProps {
  matchingResult: MatchingResult | null;
  isLoading: boolean;
  onRunMatching: () => void;
}

export interface OrderMatcherProps {
  matchingResult: MatchingResult | null;
  isLoading: boolean;
  onRunMatching: () => void;
}

export interface HeaderProps {
  className?: string;
}

// Re-export domain types
export type {
  Order,
  Transaction,
  MatchedOrder,
  MatchingResult,
} from "./domain";
export type { ApiResponse, ServerHealth } from "./api";
