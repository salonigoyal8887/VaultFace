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
    <Card className="bg-[#161b33] text-white">
      <CardContent className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Total Balance</h2>

        <div className="text-4xl font-bold">
          ₹{currentBalance.toFixed(2)}
        </div>

        {change !== null && (
          <p
            className={`text-sm flex items-center gap-1 ${
              change >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(change)}% from last month
          </p>
        )}

        <div className="flex justify-between gap-4 text-sm mt-2">
          <p className="text-green-400">
            Income: <span className="font-semibold">₹{currentIncome.toFixed(2)}</span>
          </p>
          <p className="text-red-400">
            Expense: <span className="font-semibold">₹{currentExpense.toFixed(2)}</span>
          </p>
        </div>

        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="month" stroke="#8884d8" />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e213a", border: "none" }}
                labelStyle={{ color: "#c3c3c3" }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#ffb347"
                strokeWidth={2}
                dot={{
                  r: 4,
                  stroke: "#ffb347",
                  strokeWidth: 2,
                  fill: "#161b33",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
