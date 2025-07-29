// components/charts/IncomeExpenseChart.tsx — Production-ready & well-commented

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
  Legend,
} from "recharts";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface IncomeExpenseChartProps {
  year: number; // Financial year to filter
}

interface DataPoint {
  month: string;
  income: number;
  expenses: number;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function IncomeExpenseChart({ year }: IncomeExpenseChartProps) {
  const { user } = useAuth();

  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchIncomeExpenseData = async () => {
      setLoading(true);
      setError(null);

      // Initialize data map for 12 months
      const monthly: Record<number, { income: number; expenses: number }> = {};
      for (let i = 0; i < 12; i++) {
        monthly[i] = { income: 0, expenses: 0 };
      }

      try {
        // 🔁 Fetch income records
        const incomeQuery = query(
          collection(db, "incomes"),
          where("userId", "==", user.uid)
        );
        const incomeSnap = await getDocs(incomeQuery);

        incomeSnap.forEach((doc) => {
          const data = doc.data();
          const dt = data.date?.seconds
            ? new Date(data.date.seconds * 1000)
            : new Date(data.date);

          if (dt.getFullYear() === year) {
            const monthIdx = dt.getMonth();
            monthly[monthIdx].income += Number(data.amount || 0);
          }
        });

        // 🔁 Fetch expense records
        const expenseQuery = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid)
        );
        const expenseSnap = await getDocs(expenseQuery);

        expenseSnap.forEach((doc) => {
          const data = doc.data();
          const dt = data.date?.seconds
            ? new Date(data.date.seconds * 1000)
            : new Date(data.date);

          if (dt.getFullYear() === year) {
            const monthIdx = dt.getMonth();
            monthly[monthIdx].expenses += Number(data.amount || 0);
          }
        });

        // 🧾 Convert to chart-friendly format
        const chartData: DataPoint[] = Object.entries(monthly).map(
          ([idx, val]) => ({
            month: MONTH_NAMES[parseInt(idx)],
            income: val.income,
            expenses: val.expenses,
          })
        );

        setData(chartData);
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setError("Failed to load chart data.");
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeExpenseData();
  }, [year, user]);

  return (
    <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">
          Income & expenses by month ({year})
        </h2>

        {loading && (
          <div className="text-center text-muted-foreground py-4 animate-pulse">Loading...</div>
        )}

        {error && (
          <div className="text-center text-red-600 py-4">{error}</div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="month" stroke="#0d9488" />
                <YAxis stroke="#0d9488" />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    color: "#0d9488"
                  }}
                  labelStyle={{ color: "#0d9488" }}
                  itemStyle={{ color: "#0d9488" }}
                  formatter={(value: number, key: string) => [`₹${value.toLocaleString()}`, key]}
                />
                <Legend wrapperStyle={{ color: "#0d9488" }} />
                <Bar dataKey="income" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-56 py-8 text-center space-y-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3M7 16L12 11M12 11L17 16M12 11V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" />
            </svg>
            <p className="text-sm text-muted-foreground">
              No data available for {year}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
