
import { Transaction } from "@/types";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TransactionsListProps {
  transactions: Transaction[];
  currentUserId: string;
  showAll?: boolean;
}

const TransactionsList = ({ transactions, currentUserId, showAll = false }: TransactionsListProps) => {
  if (!transactions || transactions.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No transactions found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            {showAll && <TableHead>Date</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const isOutgoing = transaction.senderId === currentUserId;
            const isTransfer = transaction.type === "transfer";
            
            let icon;
            if (transaction.type === "deposit") {
              icon = <ArrowDownLeft className="h-4 w-4 text-green-500" />;
            } else if (transaction.type === "withdrawal") {
              icon = <ArrowUpRight className="h-4 w-4 text-red-500" />;
            } else {
              icon = <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
            }

            let statusBadge;
            switch (transaction.status) {
              case "completed":
                statusBadge = <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
                break;
              case "pending":
                statusBadge = <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
                break;
              case "failed":
                statusBadge = <Badge variant="outline" className="bg-red-50 text-red-700">Failed</Badge>;
                break;
              case "flagged":
                statusBadge = (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Flagged
                  </Badge>
                );
                break;
            }
            
            return (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center">
                    {icon}
                    <span className="ml-2 capitalize">{transaction.type}</span>
                  </div>
                </TableCell>
                <TableCell className={`font-medium ${isOutgoing && isTransfer ? "text-red-600" : "text-green-600"}`}>
                  {isOutgoing && isTransfer ? "-" : "+"} ${transaction.amount.toFixed(2)}
                </TableCell>
                {showAll && (
                  <TableCell>
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </TableCell>
                )}
                <TableCell>{statusBadge}</TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {transaction.note || "No details provided"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsList;
