
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TransferFormData, DepositWithdrawFormData, Wallet } from "@/types";
import { processTransaction } from "@/services/walletService";

interface TransactionFormProps {
  userId: string;
  wallet: Wallet | null;
  onComplete: () => void;
}

const TransactionForm = ({ userId, wallet, onComplete }: TransactionFormProps) => {
  const [transferData, setTransferData] = useState<TransferFormData>({
    recipientUsername: "",
    amount: 0,
    note: "",
  });

  const [depositWithdrawData, setDepositWithdrawData] = useState<DepositWithdrawFormData>({
    amount: 0,
    note: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransferData((prev) => ({ ...prev, [name]: name === "amount" ? parseFloat(value) || 0 : value }));
  };

  const handleDepositWithdrawChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDepositWithdrawData((prev) => ({ ...prev, [name]: name === "amount" ? parseFloat(value) || 0 : value }));
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    
    if (transferData.amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Amount must be greater than zero.",
      });
      return;
    }

    if (transferData.amount > wallet.balance) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough funds to complete this transfer.",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      await processTransaction({
        type: "transfer",
        senderId: userId,
        recipientUsername: transferData.recipientUsername,
        amount: transferData.amount,
        note: transferData.note,
      });
      
      toast({
        title: "Transfer initiated",
        description: `$${transferData.amount} is being transferred to ${transferData.recipientUsername}.`,
      });
      
      setTransferData({
        recipientUsername: "",
        amount: 0,
        note: "",
      });
      
      onComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Transfer failed",
        description: error.message || "An error occurred while processing your transfer.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDepositWithdraw = async (type: "deposit" | "withdrawal") => {
    if (!wallet) return;
    
    if (depositWithdrawData.amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Amount must be greater than zero.",
      });
      return;
    }

    if (type === "withdrawal" && depositWithdrawData.amount > wallet.balance) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough funds for this withdrawal.",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      await processTransaction({
        type,
        senderId: userId,
        amount: depositWithdrawData.amount,
        note: depositWithdrawData.note,
      });
      
      toast({
        title: type === "deposit" ? "Deposit successful" : "Withdrawal initiated",
        description: `$${depositWithdrawData.amount} has been ${type === "deposit" ? "deposited into" : "withdrawn from"} your wallet.`,
      });
      
      setDepositWithdrawData({
        amount: 0,
        note: "",
      });
      
      onComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `${type === "deposit" ? "Deposit" : "Withdrawal"} failed`,
        description: error.message || `An error occurred during the ${type}.`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Transfer, deposit, or withdraw funds</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Unable to load your wallet information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>Transfer, deposit, or withdraw funds</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="transfer">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transfer">
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientUsername">Recipient Username</Label>
                <Input
                  id="recipientUsername"
                  name="recipientUsername"
                  placeholder="Enter username"
                  value={transferData.recipientUsername}
                  onChange={handleTransferChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transferAmount">Amount (USD)</Label>
                <Input
                  id="transferAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={transferData.amount || ""}
                  onChange={handleTransferChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transferNote">Note (Optional)</Label>
                <Textarea
                  id="transferNote"
                  name="note"
                  placeholder="Add a note for this transfer"
                  value={transferData.note}
                  onChange={handleTransferChange}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Transfer Funds"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="deposit">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Amount (USD)</Label>
                <Input
                  id="depositAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={depositWithdrawData.amount || ""}
                  onChange={handleDepositWithdrawChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="depositNote">Note (Optional)</Label>
                <Textarea
                  id="depositNote"
                  name="note"
                  placeholder="Add a note for this deposit"
                  value={depositWithdrawData.note}
                  onChange={handleDepositWithdrawChange}
                />
              </div>
              
              <Button 
                className="w-full" 
                disabled={isProcessing}
                onClick={() => handleDepositWithdraw("deposit")}
              >
                {isProcessing ? "Processing..." : "Deposit Funds"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="withdraw">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawAmount">Amount (USD)</Label>
                <Input
                  id="withdrawAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={depositWithdrawData.amount || ""}
                  onChange={handleDepositWithdrawChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="withdrawNote">Note (Optional)</Label>
                <Textarea
                  id="withdrawNote"
                  name="note"
                  placeholder="Add a note for this withdrawal"
                  value={depositWithdrawData.note}
                  onChange={handleDepositWithdrawChange}
                />
              </div>
              
              <Button 
                className="w-full" 
                disabled={isProcessing}
                onClick={() => handleDepositWithdraw("withdrawal")}
              >
                {isProcessing ? "Processing..." : "Withdraw Funds"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-4">
        <div>Available balance: ${wallet.balance.toFixed(2)} USD</div>
      </CardFooter>
    </Card>
  );
};

export default TransactionForm;
