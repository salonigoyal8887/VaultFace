"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";

interface TotalBalanceCardProps {
  month: number;
  year: number;
}

interface BalanceDataPoint {
  month: string;
  balance: number;
}

export default function TotalBalanceCard({ month, year }: TotalBalanceCardProps) {
  const { user } = useAuth();

  const [data, setData] = useState<BalanceDataPoint[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [currentIncome, setCurrentIncome] = useState(0);
  const [currentExpense, setCurrentExpense] = useState(0);
  const [change, setChange] = useState<number | null>(null);

  const parseDate = (raw: Timestamp | string | Date | null | undefined): Date | null => {
    if (!raw) return null;
    if (raw instanceof Timestamp) return raw.toDate();
    if (typeof raw === "string") return new Date(raw);
    if (raw instanceof Date) return raw;
    return null;
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const incomeQuery = query(
          collection(db, "incomes"),
          where("userId", "==", user.uid)
        );
        const expenseQuery = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid)
        );

        const [incomeSnap, expenseSnap] = await Promise.all([
          getDocs(incomeQuery),
          getDocs(expenseQuery),
        ]);

        const balances: BalanceDataPoint[] = [];

        let thisMonthIncome = 0;
        let thisMonthExpense = 0;

        for (let i = 5; i >= 0; i--) {
          const targetDate = new Date(year, month - i, 1);
          const targetMonth = targetDate.getMonth();
          const targetYear = targetDate.getFullYear();

          let monthIncome = 0;
          let monthExpense = 0;

          incomeSnap.forEach((doc) => {
            const entry = doc.data();
            const dt = parseDate(entry.date);
            if (
              dt &&
              dt.getMonth() === targetMonth &&
              dt.getFullYear() === targetYear &&
              typeof entry.amount === "number"
            ) {
              monthIncome += entry.amount;
            }
          });

          expenseSnap.forEach((doc) => {
            const entry = doc.data();
            const dt = parseDate(entry.date);
            if (
              dt &&
              dt.getMonth() === targetMonth &&
              dt.getFullYear() === targetYear &&
              typeof entry.amount === "number"
            ) {
              monthExpense += entry.amount;
            }
          });

          balances.push({
            month: targetDate.toLocaleString("default", { month: "short" }),
            balance: monthIncome - monthExpense,
          });

          if (targetMonth === month && targetYear === year) {
            thisMonthIncome = monthIncome;
            thisMonthExpense = monthExpense;
          }
        }

        const latestBalance = thisMonthIncome - thisMonthExpense;
        const prevBalance = balances[balances.length - 2]?.balance || 0;

        setData(balances);
        setCurrentIncome(thisMonthIncome);
        setCurrentExpense(thisMonthExpense);
        setCurrentBalance(latestBalance);

        if (prevBalance !== 0) {
          const percentChange = ((latestBalance - prevBalance) / Math.abs(prevBalance)) * 100;
          setChange(parseFloat(percentChange.toFixed(1)));
        } else {
          setChange(latestBalance !== 0 ? 100 : 0);
        }
      } catch (error) {
        console.error("Error fetching balance data:", error);
      }
    };

    fetchData();
  }, [user, month, year]);

  return (
    <Card className="bg-primary/10 text-foreground h-full shadow-sm hover:shadow transition-all duration-200 border border-border">
      <CardContent className="p-4 space-y-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="bg-primary/20 rounded-full p-1.5 flex items-center justify-center">
            <ArrowUp size={16} className="text-primary" />
          </div>
          <span>Total Balance</span>
        </h2>

        <div className="text-4xl font-bold">
          ₹{currentBalance.toFixed(2)}
        </div>

        {change !== null && (
          <p
            className={`text-sm flex items-center gap-1 ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(change)}% from last month
          </p>
        )}

        <div className="flex justify-between gap-4 text-sm mt-2">
          <p className="text-green-600">
            Income: <span className="font-semibold">₹{currentIncome.toFixed(2)}</span>
          </p>
          <p className="text-red-600">
            Expense: <span className="font-semibold">₹{currentExpense.toFixed(2)}</span>
          </p>
        </div>

        <div className="h-24">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="month" stroke="#0d9488" />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0" }}
                  labelStyle={{ color: "#0d9488" }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    stroke: "#0d9488",
                    strokeWidth: 2,
                    fill: "white",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9H21M7 3V5M17 3V5M6 13H8M6 17H8M12 13H14M12 17H14M18 13H20M18 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50" />
              </svg>
              <p className="text-sm text-muted-foreground">No balance data yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
