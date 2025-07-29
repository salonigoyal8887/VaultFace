"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface SavingsTrendChartProps {
  year: number;
}

interface SavingsDataPoint {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export default function SavingsTrendChart({ year }: SavingsTrendChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<SavingsDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = useMemo(
    () => [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    []
  );

  const parseDate = (raw: Timestamp | string | Date | null | undefined): Date | null => {
    if (!raw) return null;
    if (raw instanceof Timestamp) return raw.toDate();
    if (typeof raw === "string") return new Date(raw);
    if (raw instanceof Date) return raw;
    return null;
  };

  useEffect(() => {
    if (!user) return;

    const fetchSavingsData = async () => {
      setLoading(true);

      const monthly: SavingsDataPoint[] = monthNames.map((month) => ({
        month,
        income: 0,
        expense: 0,
        savings: 0,
      }));

      try {
        const [incomeSnap, expenseSnap] = await Promise.all([
          getDocs(query(collection(db, "incomes"), where("userId", "==", user.uid))),
          getDocs(query(collection(db, "expenses"), where("userId", "==", user.uid))),
        ]);

        incomeSnap.forEach((doc) => {
          const { amount, date } = doc.data();
          const parsed = parseDate(date);
          if (parsed && parsed.getFullYear() === year && typeof amount === "number") {
            monthly[parsed.getMonth()].income += amount;
          }
        });

        expenseSnap.forEach((doc) => {
          const { amount, date } = doc.data();
          const parsed = parseDate(date);
          if (parsed && parsed.getFullYear() === year && typeof amount === "number") {
            monthly[parsed.getMonth()].expense += amount;
          }
        });

        monthly.forEach((entry) => {
          entry.savings = entry.income - entry.expense;
        });

        setData(monthly);
      } catch (error) {
        console.error("Failed to fetch savings data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavingsData();
  }, [user, year, monthNames]);

  const handleDownloadCSV = () => {
    const header = "Month,Income,Expenses,Savings\n";
    const rows = data
      .map(
        ({ month, income, expense, savings }) =>
          `${month},${income.toFixed(2)},${expense.toFixed(2)},${savings.toFixed(2)}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Savings_Trend_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-[#161b33] text-white">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Savings Trend - {year}</h2>
          <Button
            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-sm"
            onClick={handleDownloadCSV}
            disabled={loading || data.length === 0}
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading savings trend...</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3652" />
              <XAxis dataKey="month" stroke="#c3c3c3" />
              <YAxis stroke="#c3c3c3" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e213a", borderRadius: 8 }}
                labelStyle={{ color: "#c3c3c3" }}
                formatter={(value: number, name: string) => [
                  `₹${value.toFixed(2)}`,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#34d399"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
