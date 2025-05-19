
import { Transaction, FraudFlag } from "@/types";

// Mock flagged transactions for demo
const flaggedTransactions: (Transaction & { flags: FraudFlag[] })[] = [
  {
    id: "tx-4",
    senderId: "user-1",
    recipientId: "user-2",
    amount: 2500,
    type: "transfer",
    status: "flagged",
    timestamp: "2023-05-12T16:30:00Z",
    note: "Unusual amount",
    flags: [
      {
        id: "flag-1",
        transactionId: "tx-4",
        reason: "Large amount transfer",
        severity: "medium",
        timestamp: "2023-05-12T16:31:00Z",
        isResolved: false,
      },
    ],
  },
  {
    id: "tx-6",
    senderId: "user-2",
    recipientId: null,
    amount: 1800,
    type: "withdrawal",
    status: "flagged",
    timestamp: "2023-05-10T09:20:00Z",
    note: "Large withdrawal",
    flags: [
      {
        id: "flag-2",
        transactionId: "tx-6",
        reason: "Unusual withdrawal pattern",
        severity: "high",
        timestamp: "2023-05-10T09:21:00Z",
        isResolved: false,
      },
    ],
  },
  {
    id: "tx-7",
    senderId: "user-1",
    recipientId: "user-2",
    amount: 1000,
    type: "transfer",
    status: "flagged",
    timestamp: "2023-05-09T14:15:00Z",
    note: "Multiple transfers",
    flags: [
      {
        id: "flag-3",
        transactionId: "tx-7",
        reason: "Multiple transfers in short period",
        severity: "low",
        timestamp: "2023-05-09T14:16:00Z",
        isResolved: true,
      },
    ],
  },
];

// Fetch flagged transactions
export const fetchFlaggedTransactions = (): Promise<
  (Transaction & { flags: FraudFlag[] })[]
> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(flaggedTransactions);
    }, 800);
  });
};

// Fetch system metrics for admin dashboard
export const fetchSystemMetrics = (): Promise<{
  totalUsers: number;
  totalWallets: number;
  totalTransactions: number;
  flaggedTransactionsCount: number;
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalUsers: 24,
        totalWallets: 24,
        totalTransactions: 156,
        flaggedTransactionsCount: flaggedTransactions.length,
      });
    }, 800);
  });
};

// Resolve a flagged transaction
export const resolveFlag = (flagId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Find the flag in our mock data
        let flagFound = false;
        
        for (const transaction of flaggedTransactions) {
          for (const flag of transaction.flags) {
            if (flag.id === flagId) {
              flag.isResolved = true;
              flagFound = true;
              break;
            }
          }
          
          if (flagFound) break;
        }
        
        if (!flagFound) {
          throw new Error("Flag not found");
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 800);
  });
};

// Flag a transaction manually
export const flagTransaction = (
  transactionId: string,
  reason: string,
  severity: "low" | "medium" | "high"
): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Find the transaction in our mock data
        const transaction = flaggedTransactions.find(
          (tx) => tx.id === transactionId
        );
        
        if (!transaction) {
          throw new Error("Transaction not found");
        }
        
        // Create a new flag
        const newFlag: FraudFlag = {
          id: `flag-${Math.random().toString(36).substring(7)}`,
          transactionId,
          reason,
          severity,
          timestamp: new Date().toISOString(),
          isResolved: false,
        };
        
        transaction.flags.push(newFlag);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 800);
  });
};
