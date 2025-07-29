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
    <TrendingUp key="tip" className="text-teal-300 w-5 h-5 mt-1" />,
  ];

  return (
    <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border h-full min-h-[250px]">
      <CardContent className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-primary/10 rounded-full p-2 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">
            AI Insights for {monthName} {year}
          </h2>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center p-4">
            <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
            <span className="ml-2 text-muted-foreground">Generating insights...</span>
          </div>
        )}

        {/* Error state */}
        {error && <div className="text-red-600 font-medium p-2">{error}</div>}

        {/* Valid insights display */}
        {!loading && !error && insightPoints.length > 0 && (
          <ul className="space-y-4 p-2">
            {insightPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-primary shrink-0 mt-1" />
                <span className="text-foreground">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* No data fallback */}
        {!loading && !error && insightPoints.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 2H15M12 7V13M12 16V16.01M3 17.4V6.6C3 5.07452 4.24525 3.82 5.77002 3.82H18.23C19.7548 3.82 21 5.07452 21 6.6V17.4C21 18.9255 19.7548 20.18 18.23 20.18H5.77002C4.24525 20.18 3 18.9255 3 17.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50" />
            </svg>
            <p className="text-sm text-muted-foreground">
              No insights available for this period.<br />Add more transactions to generate insights.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
