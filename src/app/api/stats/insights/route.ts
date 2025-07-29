// File: app/api/stats/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchGeminiText } from "@/lib/gemini";

export const dynamic = "force-dynamic";

interface FinancialStatsRequest {
  totalIncome?: number;
  totalExpense?: number;
  categoryTotals?: Record<string, number>;
}

export async function POST(req: NextRequest) {
  try {
    const body: FinancialStatsRequest = await req.json();

    const totalIncome = Number(body.totalIncome || 0);
    const totalExpense = Number(body.totalExpense || 0);
    const netSavings = totalIncome - totalExpense;
    const categoryTotals = body.categoryTotals || {};

    const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount: Number(amount || 0),
    }));

    const categoriesText = categoryData.length
      ? categoryData.map(c => `- ${c.category}: ₹${c.amount.toFixed(2)}`).join("\n")
      : "No category breakdown available.";

    const prompt = `
You are a helpful financial assistant AI.

The user's financial summary is:
- Total Income: ₹${totalIncome.toFixed(2)}
- Total Expenses: ₹${totalExpense.toFixed(2)}
- Net Savings: ₹${netSavings.toFixed(2)}
- Expense Breakdown:
${categoriesText}

Please provide:
1. A short summary of their financial health.
2. 2–3 suggestions to improve budgeting/saving.
3. Simple tips for financial planning.

Only respond in clear, plain English. No greetings or sign-offs.
    `.trim();

    const insightsText = await fetchGeminiText(prompt);

    return NextResponse.json({ insights: insightsText });
  } catch (err: unknown) {
    console.error("💥 Gemini Insight API Error:", err);
    return NextResponse.json(
      {
        error: "Insight generation failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
