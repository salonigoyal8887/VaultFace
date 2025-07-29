"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface SpendingCategoryChartProps {
  month: number;
  year: number;
}

interface CategoryDataPoint {
  name: string;
  value: number;
}

const COLORS = [
  "#14b8a6", "#fcd34d", "#a78bfa", "#34d399", "#f87171",
  "#818cf8", "#fb923c", "#c084fc", "#2dd4bf", "#e879f9",
];

const parseDate = (raw: Timestamp | string | Date | null | undefined): Date | null => {
  if (!raw) return null;
  if (raw instanceof Timestamp) return raw.toDate();
  if (typeof raw === "string") return new Date(raw);
  if (raw instanceof Date) return raw;
  return null;
};

export default function SpendingCategoryChart({ month, year }: SpendingCategoryChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<CategoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedMonthName = useMemo(() => {
    return new Date(year, month).toLocaleString("default", { month: "long" });
  }, [month, year]);

  useEffect(() => {
    if (!user) return;

    const fetchCategoryData = async () => {
      setLoading(true);
      setError(null);

      const categoryMap: Record<string, number> = {};

      try {
        const expenseQuery = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(expenseQuery);

        snapshot.forEach((doc) => {
          const { date, amount, category } = doc.data();
          const parsedDate = parseDate(date);
          if (
            parsedDate &&
            parsedDate.getFullYear() === year &&
            parsedDate.getMonth() === month &&
            typeof amount === "number"
          ) {
            const cat = category || "Uncategorized";
            categoryMap[cat] = (categoryMap[cat] || 0) + amount;
          }
        });

        const formattedData: CategoryDataPoint[] = Object.entries(categoryMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setData(formattedData);
      } catch (err) {
        console.error("Failed to fetch category data:", err);
        setError("Failed to load spending category data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [month, year, user]);

  return (
    <Card className="bg-primary/10 text-foreground shadow-sm hover:shadow transition-all duration-200 border border-primary/20 h-full overflow-hidden">
      <CardContent className="p-4 h-full overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Spending by category</h2>
        <p className="text-sm mb-4 text-muted-foreground">
          For {selectedMonthName}, {year}
        </p>

        {loading && (
          <div className="h-56 flex items-center justify-center text-muted-foreground">
            <div className="animate-pulse">Loading category data...</div>
          </div>
        )}

        {error && (
          <div className="h-56 flex items-center justify-center text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="h-64 overflow-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  labelLine={false}
                  isAnimationActive
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    color: "#0d9488"
                  }}
                  labelStyle={{ color: "#0d9488" }}
                  itemStyle={{ color: "#0d9488" }}
                  formatter={(value: number, name: string) => [
                    `₹${value.toFixed(2)}`,
                    name,
                  ]}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ color: "#0d9488", paddingTop: 16 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}


        {!loading && !error && data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-56 py-8 text-center space-y-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v6m0 12v2M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" />
            </svg>
            <p className="text-sm text-muted-foreground">
              No spending data for {selectedMonthName}, {year}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
