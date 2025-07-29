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
    <Card className="bg-primary/10 text-foreground shadow-sm hover:shadow transition-all duration-200 border border-primary/20 h-full overflow-hidden">
      <CardContent className="p-4 h-full overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Income trend</h2>
        <div className="h-64 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-md bg-primary/20" />
            </div>
          ) : data.some(item => item.income > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d9488" opacity={0.3} />
                <XAxis dataKey="name" stroke="#0d9488" />
                <YAxis stroke="#0d9488" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: 8, border: "1px solid #0d9488", color: "#0d9488" }}
                  labelStyle={{ color: "#0d9488" }}
                  itemStyle={{ color: "#0d9488" }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, "Income"]}
                />
                <Bar dataKey="income" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V3M17 8L12 3M12 3L7 8M12 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" />
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
