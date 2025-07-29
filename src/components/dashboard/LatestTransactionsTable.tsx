// components/tables/LatestTransactionsTable.tsx — Production-grade & exportable transaction list

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface LatestTransactionsTableProps {
  month: number;
  year: number;
}

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: string;
  date: Date;
}

export default function LatestTransactionsTable({ month, year }: LatestTransactionsTableProps) {
  const { user } = useAuth();
  const [transactionsToDisplay, setTransactionsToDisplay] = useState<Transaction[]>([]);
  const [allMonthlyTransactions, setAllMonthlyTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedMonthName = new Date(year, month).toLocaleString("default", { month: "long" });

  useEffect(() => {
    if (!user) return;

    const parseDate = (raw: Timestamp | string | Date | undefined | null): Date | null => {
      if (!raw) return null;
      if (raw instanceof Timestamp) return raw.toDate();
      if (typeof raw === "string") return new Date(raw);
      if (raw instanceof Date) return raw;
      return null;
    };

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      const transactions: Transaction[] = [];

      try {
        // 🔹 Fetch incomes
        const incomeQuery = query(collection(db, "incomes"), where("userId", "==", user.uid));
        const incomeSnap = await getDocs(incomeQuery);
        incomeSnap.forEach((doc) => {
          const d = doc.data();
          const dt = parseDate(d.date);
          if (dt && dt.getFullYear() === year && dt.getMonth() === month && typeof d.amount === "number") {
            transactions.push({
              id: doc.id,
              title: d.title || d.source || "Income",
              amount: d.amount,
              type: "Income",
              date: dt,
            });
          }
        });

        // 🔻 Fetch expenses
        const expenseQuery = query(collection(db, "expenses"), where("userId", "==", user.uid));
        const expenseSnap = await getDocs(expenseQuery);
        expenseSnap.forEach((doc) => {
          const d = doc.data();
          const dt = parseDate(d.date);
          if (dt && dt.getFullYear() === year && dt.getMonth() === month && typeof d.amount === "number") {
            transactions.push({
              id: doc.id,
              title: d.title || d.category || "Expense",
              amount: -d.amount, // Show expense as negative
              type: d.category || "Expense",
              date: dt,
            });
          }
        });

        transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

        setAllMonthlyTransactions(transactions);
        setTransactionsToDisplay(transactions.slice(0, 50)); // Show recent 50
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [month, year, user]);

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleDownloadStatement = () => {
    if (allMonthlyTransactions.length === 0) return;

    const csvHeader = "Date,Title,Type,Amount\n";
    const csvRows = allMonthlyTransactions
      .map((txn) => {
        const date = formatDate(txn.date);
        const title = `"${txn.title.replace(/"/g, '""')}"`;  
        const type = `"${txn.type.replace(/"/g, '""')}"`;  
        const amount = txn.amount.toFixed(2);
        return `${date},${title},${type},${amount}`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Statement_${selectedMonthName}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-1.5 flex items-center justify-center">
              <Download size={16} className="text-primary" />
            </div>
            <span>Latest Transactions</span>
          </h2>
          <Button
            onClick={handleDownloadStatement}
            className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 flex items-center gap-1.5 text-sm"
            disabled={loading || allMonthlyTransactions.length === 0}
          >
            <Download size={14} />
            Download
          </Button>
        </div>

        <p className="text-sm mb-4 text-muted-foreground">
          For {selectedMonthName}, {year}
        </p>

        {loading ? (
          <div className="h-[calc(100%-100px)] flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin mr-2"></div>
            <span className="text-muted-foreground">Loading transactions...</span>
          </div>
        ) : error ? (
          <div className="h-[calc(100%-100px)] flex items-center justify-center text-red-600">{error}</div>
        ) : transactionsToDisplay.length > 0 ? (
          <ScrollArea className="h-[calc(100%-100px)] pr-6">
            <ul className="space-y-4">
              {transactionsToDisplay.map((txn) => (
                <li
                  key={txn.id}
                  className="flex items-center justify-between border-b border-border pb-3 pt-1 hover:bg-muted/50 px-2 rounded transition-colors duration-200"
                >
                  <div>
                    <p className="font-medium">{txn.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(txn.date)}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        txn.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {txn.amount > 0 ? "+" : ""}₹{Math.abs(txn.amount).toFixed(2)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${txn.amount > 0 ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}
                    >
                      {txn.type}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100%-100px)] text-center space-y-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 10H21M7 3V5M17 3V5M6 14H8M11 14H13M16 14H18M6 18H8M11 18H13M16 18H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground/50" />
            </svg>
            <p className="text-sm text-muted-foreground">
              No transactions found for {selectedMonthName}, {year}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
