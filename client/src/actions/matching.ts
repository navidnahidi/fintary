import { Transaction, MatchingResult } from "../types/domain";

const API_BASE_URL = "http://localhost:3000";

export interface MatchingRequest {
  transactions: Transaction[];
}

export interface MatchingResponse {
  success: boolean;
  data: MatchingResult;
  message: string;
  timestamp: string;
}

export const matchingActions = {
  async runMatching(transactions: Transaction[]): Promise<MatchingResult> {
    try {
      const url = `${API_BASE_URL}/v1/match/transactions`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MatchingResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to run matching");
      }

      return result.data;
    } catch (error) {
      ("Error running matching:", error);
      throw error;
    }
  },
};
