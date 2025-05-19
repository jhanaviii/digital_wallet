
export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  senderId: string;
  recipientId: string | null;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer';
  status: 'pending' | 'completed' | 'failed' | 'flagged';
  timestamp: string;
  note: string;
}

export interface FraudFlag {
  id: string;
  transactionId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  isResolved: boolean;
  resolvedBy?: string;
}

export interface TransferFormData {
  recipientUsername: string;
  amount: number;
  note: string;
}

export interface DepositWithdrawFormData {
  amount: number;
  note: string;
}
