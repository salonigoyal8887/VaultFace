// ExpenseChart.tsx

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyExpense {
  name: string; // Month abbreviation, e.g., "Jan"
  expense: number;
}

interface ExpenseData {
  date: Timestamp | string | Date;
  amount: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const parseDate = (raw: Timestamp | string | Date | undefined | null): Date | null => {
  if (!raw) return null;
  if (raw instanceof Timestamp) return raw.toDate();
  if (typeof raw === "string") return new Date(raw);
  if (raw instanceof Date) return raw;
  return null;
};

const buildMonthlyExpenseData = (expenses: ExpenseData[]): MonthlyExpense[] => {
  const totals: Record<string, number> = {};

  expenses.forEach((expense) => {
    const date = parseDate(expense.date);
    if (!date) return;

    const month = dayjs(date).format("MMM");
    totals[month] = (totals[month] || 0) + Number(expense.amount || 0);
  });

  return MONTHS.map((month) => ({
    name: month,
    expense: totals[month] || 0,
  }));
};

export default function ExpenseChart({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlyExpenses = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const q = query(collection(db, "expenses"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const rawExpenses: ExpenseData[] = snapshot.docs.map((doc) => doc.data() as ExpenseData);

        const monthlyData = buildMonthlyExpenseData(rawExpenses);
        setChartData(monthlyData);
      } catch (err) {
        console.error("Error fetching expenses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyExpenses();
  }, [user, refreshKey]);

  return (
    <Card className="bg-primary/10 text-foreground shadow-sm hover:shadow transition-all duration-200 border border-primary/20 h-full overflow-hidden">
      <CardContent className="p-4 h-full overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Expense trend</h2>
        <div className="h-64 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-md bg-primary/20" />
            </div>
          ) : chartData.some(item => item.expense > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d9488" opacity={0.3} />
                <XAxis dataKey="name" stroke="#0d9488" />
                <YAxis stroke="#0d9488" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: 8, border: "1px solid #0d9488", color: "#0d9488" }}
                  labelStyle={{ color: "#0d9488" }}
                  itemStyle={{ color: "#0d9488" }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, "Expense"]}
                />
                <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3M7 16L12 11M12 11L17 16M12 11V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" />
              </svg>
              <p className="text-sm text-muted-foreground">
                No data yet
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
