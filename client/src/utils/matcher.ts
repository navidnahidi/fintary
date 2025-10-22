import {
  Order,
  Transaction,
  MatchedOrder,
  MatchingResult,
} from "../types/domain";

// Simple string similarity using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  return matrix[str2.length][str1.length];
}

function stringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  return (
    1 - levenshteinDistance(str1.toLowerCase(), str2.toLowerCase()) / maxLength
  );
}

function dateDifferenceInDays(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateMatchScore(order: Order, transaction: Transaction): number {
  // Only use customer name similarity for matching
  const customerSimilarity = stringSimilarity(
    order.customer,
    transaction.customer,
  );
  return customerSimilarity;
}

export function runClientSideMatching(
  orders: Order[],
  transactions: Transaction[],
): MatchingResult {
  const matched: MatchedOrder[] = [];
  const unmatchedOrders: Order[] = [];
  const unmatchedTransactions: Transaction[] = [...transactions];

  // For each order, find the best matching transaction
  for (const order of orders) {
    let bestMatch: { transaction: Transaction; score: number } | null = null;
    let bestIndex = -1;

    // Find the best matching transaction for this order
    for (let i = 0; i < unmatchedTransactions.length; i++) {
      const transaction = unmatchedTransactions[i];
      const score = calculateMatchScore(order, transaction);

      // Only consider matches with score > 0.6
      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { transaction, score };
        bestIndex = i;
      }
    }

    if (bestMatch && bestMatch.score > 0.6) {
      // Found a good match
      const matchedTransaction = unmatchedTransactions[bestIndex];
      matched.push({
        order,
        txns: [matchedTransaction],
        matchScore: bestMatch.score,
      });

      // Remove the matched transaction from unmatched list
      unmatchedTransactions.splice(bestIndex, 1);
    } else {
      // No good match found for this order
      unmatchedOrders.push(order);
    }
  }

  return {
    matched,
    unmatchedOrders,
    unmatchedTransactions,
  };
}

// Helper function to generate sample data for testing
export function generateSampleData(): {
  orders: Order[];
  transactions: Transaction[];
} {
  const orders: Order[] = [
    {
      customer: "John Smith",
      orderId: "ORD001",
      date: "2024-01-15",
      item: "Laptop",
      priceCents: 120000,
    },
    {
      customer: "Jane Doe",
      orderId: "ORD002",
      date: "2024-01-16",
      item: "Mouse",
      priceCents: 2500,
    },
    {
      customer: "Bob Johnson",
      orderId: "ORD003",
      date: "2024-01-17",
      item: "Keyboard",
      priceCents: 8500,
    },
    {
      customer: "Johnny Smith", // Similar to John Smith
      orderId: "ORD004",
      date: "2024-01-18",
      item: "Tablet",
      priceCents: 50000,
    },
  ];

  const transactions: Transaction[] = [
    {
      customer: "John Smith",
      orderId: "ORD001",
      date: "2024-01-15",
      item: "Laptop",
      priceCents: 120000,
      txnType: "Purchase",
      txnAmountCents: 120000,
    },
    {
      customer: "Jane Doe",
      orderId: "ORD002",
      date: "2024-01-16",
      item: "Mouse",
      priceCents: 2500,
      txnType: "Purchase",
      txnAmountCents: 2500,
    },
    {
      customer: "Alice Brown",
      orderId: "ORD005",
      date: "2024-01-18",
      item: "Monitor",
      priceCents: 30000,
      txnType: "Purchase",
      txnAmountCents: 30000,
    },
    {
      customer: "John Smith", // Duplicate customer
      orderId: "ORD006",
      date: "2024-01-19",
      item: "Phone",
      priceCents: 80000,
      txnType: "Purchase",
      txnAmountCents: 80000,
    },
  ];

  return { orders, transactions };
}
