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
  "#60a5fa", "#fcd34d", "#a78bfa", "#34d399", "#f87171",
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
    <Card className="bg-[#161b33] text-white">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-2">Spending by Category</h2>
        <p className="text-sm mb-4 text-muted-foreground">
          For {selectedMonthName}, {year}
        </p>

        {loading && (
          <div className="h-56 flex items-center justify-center text-gray-400">
            Loading category data...
          </div>
        )}

        {error && (
          <div className="h-56 flex items-center justify-center text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="h-64">
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
                    backgroundColor: "#1e213a",
                    borderRadius: 8,
                    border: "none",
                  }}
                  labelStyle={{ color: "#c3c3c3" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value: number, name: string) => [
                    `₹${value.toFixed(2)}`,
                    name,
                  ]}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ color: "#fff", paddingTop: 16 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}


        {!loading && !error && data.length === 0 && (
          <div className="h-56 flex items-center justify-center text-gray-400">
            No spending data for {selectedMonthName}, {year}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
