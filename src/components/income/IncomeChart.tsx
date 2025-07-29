// IncomeChart.tsx 

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
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, isValid, format } from "date-fns";

interface IncomeChartProps {
  refreshKey?: number;
}

interface IncomeRecord {
  amount: number;
  date: Timestamp | string | Date | null | undefined;
}

interface MonthlyIncome {
  name: string; // Month short name (Jan, Feb, ...)
  income: number;
}

const MONTHS_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Normalizes a raw Firestore date field into a valid Date object.
 */
function parseIncomeDate(raw: IncomeRecord["date"]): Date | null {
  if (!raw) return null;
  if (raw instanceof Timestamp) return raw.toDate();
  if (typeof raw === "string") return parseISO(raw);
  if (raw instanceof Date) return raw;
  return null;
}

/**
 * Aggregates income amounts by month for chart display.
 */
function buildMonthlyIncomeData(incomes: IncomeRecord[]): MonthlyIncome[] {
  const monthly: Record<string, number> = {};

  for (const income of incomes) {
    const date = parseIncomeDate(income.date);
    if (!date || !isValid(date)) continue;

    const month = format(date, "MMM");
    const amount = Number(income.amount || 0);

    monthly[month] = (monthly[month] || 0) + amount;
  }

  return MONTHS_ORDER.map((month) => ({
    name: month,
    income: monthly[month] || 0,
  }));
}

export default function IncomeChart({ refreshKey = 0 }: IncomeChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyIncome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncome = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const q = query(collection(db, "incomes"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);

        const rawIncomes: IncomeRecord[] = snapshot.docs.map((doc) => ({
          amount: Number(doc.data().amount || 0),
          date: doc.data().date,
        }));

        const monthlyData = buildMonthlyIncomeData(rawIncomes);
        setData(monthlyData);
      } catch (err) {
        console.error("Failed to fetch income chart:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, [user, refreshKey]);

  return (
    <Card className="bg-[#161b33] text-white h-full min-h-[300px]">
      <CardContent className="p-4 flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">📈 Income Trend</h2>
        <div className="flex-grow">
          {loading ? (
            <Skeleton className="w-full h-full rounded-md bg-muted/30" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c2f49" />
                <XAxis dataKey="name" stroke="#c3c3c3" />
                <YAxis stroke="#c3c3c3" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e213a", border: "none" }}
                  labelStyle={{ color: "#60a5fa" }}
                  itemStyle={{ color: "#60a5fa" }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, "Income"]}
                />
                <Bar dataKey="income" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
