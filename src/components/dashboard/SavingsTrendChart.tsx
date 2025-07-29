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
    <Card className="bg-primary/10 text-foreground shadow-sm hover:shadow transition-all duration-200 border border-primary/20 h-full overflow-hidden">
      <CardContent className="p-4 h-full overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Savings trend ({year})</h2>
          <Button
            className="text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm"
            onClick={handleDownloadCSV}
            disabled={loading || data.length === 0}
            size="sm"
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground animate-pulse">Loading savings trend...</p>
          </div>
        ) : data.some(item => item.income > 0 || item.expense > 0) ? (
          <div className="h-64 overflow-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d9488" opacity={0.3} />
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
                  formatter={(value: number, name: string) => [
                    `₹${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#0d9488", stroke: "#0d9488" }}
                  activeDot={{ r: 5, fill: "#ffffff", stroke: "#0d9488" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 py-8 text-center space-y-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V3M17 8L12 3M12 3L7 8M12 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" />
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
