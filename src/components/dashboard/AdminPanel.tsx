
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Transaction, FraudFlag } from "@/types";
import { 
  fetchFlaggedTransactions, 
  fetchSystemMetrics,
  resolveFlag
} from "@/services/adminService";
import { AlertTriangle, CheckCircle, Users, Wallet, Activity, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const AdminPanel = () => {
  const [flaggedTransactions, setFlaggedTransactions] = useState<(Transaction & { flags: FraudFlag[] })[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalWallets: 0,
    totalTransactions: 0,
    flaggedTransactionsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [flagged, systemMetrics] = await Promise.all([
          fetchFlaggedTransactions(),
          fetchSystemMetrics(),
        ]);
        
        setFlaggedTransactions(flagged);
        setMetrics(systemMetrics);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const handleResolveFlag = async (flagId: string) => {
    try {
      await resolveFlag(flagId);
      
      // Update the local state to reflect the resolved flag
      setFlaggedTransactions((current) =>
        current.map((transaction) => ({
          ...transaction,
          flags: transaction.flags.map((flag) =>
            flag.id === flagId ? { ...flag, isResolved: true } : flag
          ),
        }))
      );
    } catch (error) {
      console.error("Failed to resolve flag:", error);
    }
  };

  // Data for fraud distribution chart
  const fraudData = [
    { name: "High Risk", value: 4, color: "#ef4444" },
    { name: "Medium Risk", value: 8, color: "#f97316" },
    { name: "Low Risk", value: 12, color: "#eab308" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{metrics.totalUsers}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <Wallet className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">{metrics.totalWallets}</p>
            <p className="text-sm text-muted-foreground">Active Wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <Activity className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
            <p className="text-sm text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">{metrics.flaggedTransactionsCount}</p>
            <p className="text-sm text-muted-foreground">Flagged Transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fraud Risk Distribution</CardTitle>
            <CardDescription>
              Distribution of flagged transactions by risk level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fraudData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {fraudData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {fraudData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium">Fraud Detection System</p>
                    <p className="text-xs text-muted-foreground">
                      Active and monitoring
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium">Transaction Processor</p>
                    <p className="text-xs text-muted-foreground">
                      Processing normally
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="font-medium">Daily Fraud Scan</p>
                    <p className="text-xs text-muted-foreground">
                      Scheduled for 12:00 AM UTC
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  Pending
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Transactions</CardTitle>
          <CardDescription>
            Transactions that have been flagged by the fraud detection system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flaggedTransactions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No flagged transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Flag Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">
                        {transaction.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.flags[0]?.reason || "Unknown"}</TableCell>
                      <TableCell>
                        {transaction.flags[0]?.severity === "high" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">High</Badge>
                        )}
                        {transaction.flags[0]?.severity === "medium" && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">Medium</Badge>
                        )}
                        {transaction.flags[0]?.severity === "low" && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Low</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.flags[0]?.isResolved ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">Resolved</Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResolveFlag(transaction.flags[0].id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
