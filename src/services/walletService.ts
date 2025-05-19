
import { Wallet, Transaction } from "@/types";

// Mock wallets for demo
const wallets = [
  {
    id: "wallet-1",
    userId: "user-1",
    balance: 5000,
    currency: "USD",
    isActive: true,
    lastUpdated: "2023-05-15T10:30:00Z",
  },
  {
    id: "wallet-2",
    userId: "user-2",
    balance: 2500,
    currency: "USD",
    isActive: true,
    lastUpdated: "2023-05-14T08:15:00Z",
  },
];

// Mock transactions for demo
let transactions: Transaction[] = [
  {
    id: "tx-1",
    senderId: "user-2",
    recipientId: "user-1",
    amount: 500,
    type: "transfer",
    status: "completed",
    timestamp: "2023-05-15T09:30:00Z",
    note: "Payment for services",
  },
  {
    id: "tx-2",
    senderId: "user-1",
    recipientId: null,
    amount: 1000,
    type: "deposit",
    status: "completed",
    timestamp: "2023-05-14T14:20:00Z",
    note: "Monthly deposit",
  },
  {
    id: "tx-3",
    senderId: "user-1",
    recipientId: null,
    amount: 300,
    type: "withdrawal",
    status: "completed",
    timestamp: "2023-05-13T11:45:00Z",
    note: "ATM withdrawal",
  },
  {
    id: "tx-4",
    senderId: "user-1",
    recipientId: "user-2",
    amount: 2500,
    type: "transfer",
    status: "flagged",
    timestamp: "2023-05-12T16:30:00Z",
    note: "Unusual amount",
  },
  {
    id: "tx-5",
    senderId: "user-2",
    recipientId: null,
    amount: 1500,
    type: "deposit",
    status: "completed",
    timestamp: "2023-05-11T10:15:00Z",
    note: "Salary deposit",
  },
];

// Mock users data for recipient lookup
const users = [
  {
    id: "user-1",
    username: "admin",
  },
  {
    id: "user-2",
    username: "user",
  },
];

// Fetch wallet for a user
export const fetchWallet = (userId: string): Promise<Wallet> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const wallet = wallets.find((w) => w.userId === userId);
      
      if (!wallet) {
        // If no wallet found, create one for demo purposes
        const newWallet: Wallet = {
          id: `wallet-${wallets.length + 1}`,
          userId,
          balance: 1000, // Start with some money
          currency: "USD",
          isActive: true,
          lastUpdated: new Date().toISOString(),
        };
        
        wallets.push(newWallet);
        resolve(newWallet);
      } else {
        resolve(wallet);
      }
    }, 500);
  });
};

// Fetch transactions for a user
export const fetchTransactions = (userId: string): Promise<Transaction[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userTransactions = transactions.filter(
        (tx) => tx.senderId === userId || tx.recipientId === userId
      );
      
      // Sort by timestamp, newest first
      userTransactions.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      resolve(userTransactions);
    }, 500);
  });
};

// Process a transaction (transfer, deposit, or withdrawal)
export const processTransaction = async (transactionData: any): Promise<Transaction> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const { type, senderId, recipientUsername, amount, note } = transactionData;
        
        // Validate amount
        if (amount <= 0) {
          throw new Error("Amount must be greater than zero");
        }
        
        // Find sender's wallet
        const senderWallet = wallets.find((w) => w.userId === senderId);
        if (!senderWallet) {
          throw new Error("Sender wallet not found");
        }
        
        // For transfers, find recipient
        let recipientId = null;
        let recipientWallet = null;
        
        if (type === "transfer") {
          if (!recipientUsername) {
            throw new Error("Recipient username is required for transfers");
          }
          
          const recipient = users.find((u) => u.username === recipientUsername);
          if (!recipient) {
            throw new Error("Recipient not found");
          }
          
          recipientId = recipient.id;
          recipientWallet = wallets.find((w) => w.userId === recipientId);
          
          if (!recipientWallet) {
            // Create a wallet for the recipient if they don't have one
            recipientWallet = {
              id: `wallet-${wallets.length + 1}`,
              userId: recipientId,
              balance: 0,
              currency: "USD",
              isActive: true,
              lastUpdated: new Date().toISOString(),
            };
            wallets.push(recipientWallet);
          }
          
          // Check if sender has enough funds
          if (senderWallet.balance < amount) {
            throw new Error("Insufficient funds");
          }
        }
        
        // Create a new transaction
        const newTransaction: Transaction = {
          id: `tx-${transactions.length + 1}`,
          senderId,
          recipientId,
          amount,
          type,
          status: "completed", // Default status
          timestamp: new Date().toISOString(),
          note: note || "",
        };
        
        // Perform fraud detection
        const isFlagged = await performFraudDetection(newTransaction, senderWallet);
        
        if (isFlagged) {
          newTransaction.status = "flagged";
        } else {
          // Update wallet balances
          if (type === "transfer") {
            senderWallet.balance -= amount;
            if (recipientWallet) recipientWallet.balance += amount;
          } else if (type === "deposit") {
            senderWallet.balance += amount;
          } else if (type === "withdrawal") {
            senderWallet.balance -= amount;
          }
          
          // Update last updated timestamp
          senderWallet.lastUpdated = new Date().toISOString();
          if (recipientWallet) {
            recipientWallet.lastUpdated = new Date().toISOString();
          }
        }
        
        // Add the transaction to the history
        transactions.push(newTransaction);
        
        resolve(newTransaction);
      } catch (error: any) {
        reject(error);
      }
    }, 1000); // Simulate network delay
  });
};

// Perform basic fraud detection
const performFraudDetection = async (
  transaction: Transaction,
  wallet: Wallet
): Promise<boolean> => {
  // Check for suspicious patterns
  
  // 1. Large amount check (over 2000)
  const isLargeAmount = transaction.amount > 2000;
  
  // 2. Multiple transfers in a short period
  const recentTransactions = transactions.filter(
    (tx) =>
      tx.senderId === transaction.senderId &&
      tx.type === transaction.type &&
      new Date(tx.timestamp).getTime() > Date.now() - 1000 * 60 * 60 // Last hour
  );
  
  const hasMultipleTransfers = recentTransactions.length >= 3;
  
  // 3. Unusual withdrawal (over 50% of balance)
  const isLargeWithdrawal =
    transaction.type === "withdrawal" &&
    transaction.amount > wallet.balance * 0.5;
  
  return isLargeAmount || hasMultipleTransfers || isLargeWithdrawal;
};
