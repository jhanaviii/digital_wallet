
import { useState, useEffect } from "react";
import { User, Wallet, Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletOverview from "./WalletOverview";
import TransactionsList from "./TransactionsList";
import TransactionForm from "./TransactionForm";
import AdminPanel from "./AdminPanel";
import { fetchWallet, fetchTransactions } from "@/services/walletService";
import { ArrowLeftRight, CreditCard, LineChart, LogOut } from "lucide-react";

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (user) {
        try {
          const walletData = await fetchWallet(user.id);
          const transactionsData = await fetchTransactions(user.id);
          
          setWallet(walletData);
          setTransactions(transactionsData);
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();
  }, [user]);

  const reloadTransactions = async () => {
    if (user) {
      try {
        const transactionsData = await fetchTransactions(user.id);
        const walletData = await fetchWallet(user.id);
        setTransactions(transactionsData);
        setWallet(walletData);
      } catch (error) {
        console.error("Failed to reload transactions:", error);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">DigiWallet</h1>
            <p className="text-slate-600">Welcome, {user.username}!</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading your wallet...</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid grid-cols-4 md:grid-cols-4 lg:w-[600px] mx-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              {user.isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <WalletOverview wallet={wallet} />
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your last 5 transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TransactionsList 
                      transactions={transactions.slice(0, 5)} 
                      currentUserId={user.id} 
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transfer">
              <div className="grid md:grid-cols-2 gap-6">
                <TransactionForm 
                  userId={user.id} 
                  wallet={wallet} 
                  onComplete={reloadTransactions} 
                />
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Tips</CardTitle>
                    <CardDescription>
                      Guidelines for safe transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
                      <li>Verify recipient details before transferring funds</li>
                      <li>Keep your login credentials secure</li>
                      <li>Report any suspicious activity immediately</li>
                      <li>Don't share your account details with others</li>
                      <li>Monitor your transaction history regularly</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Complete record of your transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionsList 
                    transactions={transactions} 
                    currentUserId={user.id} 
                    showAll={true} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {user.isAdmin && (
              <TabsContent value="admin">
                <AdminPanel />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
