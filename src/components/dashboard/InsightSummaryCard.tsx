// components/cards/InsightSummaryCard.tsx — AI-powered insight card with Gemini

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BadgeCheck, Lightbulb, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface InsightSummaryCardProps {
  month: number; // Month index (0–11)
  year: number;
}

export default function InsightSummaryCard({ month, year }: InsightSummaryCardProps) {
  const { user } = useAuth();

  const [insightPoints, setInsightPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // For display header: "May 2025", etc.
  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
  });

  useEffect(() => {
    if (!user) return;

    const fetchInsight = async () => {
      setLoading(true);
      setInsightPoints([]);
      setError(null);

      let totalIncome = 0;
      let totalExpense = 0;

      try {
        // 🔹 Fetch income entries
        const incomeQuery = query(
          collection(db, "incomes"),
          where("userId", "==", user.uid)
        );
        const incomeSnap = await getDocs(incomeQuery);
        incomeSnap.forEach((doc) => {
          const d = doc.data();
          const rawDate = d.date;

          let dt: Date | null = null;
          if (rawDate?.seconds) dt = new Date(rawDate.seconds * 1000);
          else if (typeof rawDate === "string") dt = new Date(rawDate);
          else if (rawDate instanceof Date) dt = rawDate;

          if (
            dt &&
            dt.getFullYear() === year &&
            dt.getMonth() === month &&
            typeof d.amount === "number"
          ) {
            totalIncome += d.amount;
          }
        });

        // Fetch expense entries
        const expenseQuery = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid)
        );
        const expenseSnap = await getDocs(expenseQuery);
        expenseSnap.forEach((doc) => {
          const d = doc.data();
          const rawDate = d.date;

          let dt: Date | null = null;
          if (rawDate?.seconds) dt = new Date(rawDate.seconds * 1000);
          else if (typeof rawDate === "string") dt = new Date(rawDate);
          else if (rawDate instanceof Date) dt = rawDate;

          if (
            dt &&
            dt.getFullYear() === year &&
            dt.getMonth() === month &&
            typeof d.amount === "number"
          ) {
            totalExpense += d.amount;
          }
        });

        const savings = totalIncome - totalExpense;

        // Generate Gemini prompt for insights
        const prompt = `
You are a helpful AI financial assistant.

Analyze this user's monthly finance summary and return exactly 2–3 concise bullet points:
* One insight about income
* One insight about spending
* One improvement tip (optional)

Respond ONLY with bullet points in markdown format using "*".

Month: ${monthName} ${year}
Total Income: ₹${totalIncome.toFixed(2)}
Total Expense: ₹${totalExpense.toFixed(2)}
Savings: ₹${savings.toFixed(2)}
        `.trim();

        // 🔗 Call Gemini-powered API
        const res = await fetch("/api/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Unknown Gemini error");
        }

        const data = await res.json();
        const content = data?.content?.trim();

        if (!content) {
          setError("No insight returned from Gemini.");
          return;
        }

        // Parse markdown bullets from Gemini response
        const bullets = content
          .split("\n")
          .filter((line: string) => line.trim().startsWith("*"))
          .map((line: string) => line.replace(/^\*\s*/, "").trim());

        setInsightPoints(bullets.slice(0, 3));
      } catch (err) {
        console.error("Insight fetch error:", err);
        setError("Failed to analyze your data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [month, year, user, monthName]);

  // Insight type to icon map
  const iconMap = [
    <Lightbulb key="income" className="text-yellow-300 w-5 h-5 mt-1" />,
    <BadgeCheck key="spending" className="text-teal-300 w-5 h-5 mt-1" />,
    <TrendingUp key="tip" className="text-purple-300 w-5 h-5 mt-1" />,
  ];

  return (
    <Card className="bg-[#161b33] text-white h-full min-h-[250px]">
      <CardContent className="p-5 flex flex-col gap-4">
        <h2 className="text-xl font-bold">📘 AI Financial Insights</h2>
        <p className="text-sm text-muted-foreground mb-1">
          For{" "}
          <span className="text-white font-medium">
            {monthName} {year}
          </span>
        </p>

        {/* Loading state */}
        {loading && (
          <p className="text-blue-200 text-center text-base py-6">
            ⏳ Analyzing your financial data with Gemini...
          </p>
        )}

        {/* Error state */}
        {error && (
          <p className="text-red-400 text-center text-base py-6">{error}</p>
        )}

        {/* Valid insights display */}
        {!loading && !error && insightPoints.length > 0 && (
          <div className="flex flex-col gap-4">
            {insightPoints.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-base leading-relaxed"
              >
                {iconMap[idx] || (
                  <BadgeCheck className="text-green-300 w-5 h-5 mt-1" />
                )}
                <p className="text-blue-100">
                  <span className="font-semibold text-white">
                    {idx === 0
                      ? "Income Insight: "
                      : idx === 1
                      ? "Spending Insight: "
                      : "Improvement Tip: "}
                  </span>
                  {point}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* No data fallback */}
        {!loading && !error && insightPoints.length === 0 && (
          <p className="text-gray-400 text-center py-6">
            No insights available yet. Add some transactions to get started!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
