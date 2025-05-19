
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Wallet } from "@/types";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface WalletOverviewProps {
  wallet: Wallet | null;
}

// Mock data for the balance history chart
const mockBalanceData = [
  { date: "Mar 1", balance: 1250 },
  { date: "Mar 5", balance: 1400 },
  { date: "Mar 10", balance: 1300 },
  { date: "Mar 15", balance: 1800 },
  { date: "Mar 20", balance: 2100 },
  { date: "Mar 25", balance: 1900 },
  { date: "Mar 30", balance: 2500 },
];

const WalletOverview = ({ wallet }: WalletOverviewProps) => {
  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Overview</CardTitle>
          <CardDescription>Your digital wallet information</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Wallet information is not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Overview</CardTitle>
        <CardDescription>Your digital wallet information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="text-2xl font-bold text-slate-800">
            {wallet.balance.toLocaleString('en-US', {
              style: 'currency',
              currency: wallet.currency,
            })}
          </div>
          <p className="text-sm text-slate-500">Current Balance</p>
        </div>

        <div className="h-[150px]">
          <p className="text-sm font-medium mb-2">30-Day Balance History</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockBalanceData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                hide={true}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Balance']} 
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#2563eb" 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-600 font-medium">Account Status</div>
            <div className="text-sm mt-1">
              {wallet.isActive ? "Active" : "Inactive"}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-600 font-medium">Last Updated</div>
            <div className="text-sm mt-1">
              {new Date(wallet.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Wallet ID: {wallet.id.substring(0, 8)}...
      </CardFooter>
    </Card>
  );
};

export default WalletOverview;
