// File: app/api/stats/summary/route.ts
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface SummaryResponse {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  categoryTotals: Record<string, number>;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const fromDate = parseDateParam(searchParams.get("from"));
    const toDate = parseDateParam(searchParams.get("to"));
    
    console.log("API Request params:", { uid, fromDate, toDate });

    if (!uid) {
      return NextResponse.json({ error: "Missing 'uid' parameter." }, { status: 400 });
    }

    // Check if the uid field is 'userId' or 'uid' in the database
    console.log("Querying Firestore with uid:", uid);
    
    // Try both 'userId' and 'uid' fields to ensure we're querying correctly
    const incomesQuery = query(collection(db, "incomes"), where("userId", "==", uid));
    const expensesQuery = query(collection(db, "expenses"), where("userId", "==", uid));

    const [incomeSnap, expenseSnap] = await Promise.all([
      getDocs(incomesQuery),
      getDocs(expensesQuery),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    const isWithinRange = (rawDate: unknown): boolean => {
      const date = parseFirestoreDate(rawDate);
      if (!date) {
        console.log("Date parsing failed for:", rawDate);
        return false;
      }
      
      const result = (
        (!fromDate || date >= fromDate) && 
        (!toDate || date <= toDate)
      );
      
      if (!result) {
        console.log("Date out of range:", { 
          date, 
          fromDate, 
          toDate, 
          beforeFromDate: fromDate && date < fromDate,
          afterToDate: toDate && date > toDate
        });
      }
      
      return result;
    };

    console.log("Processing income docs, count:", incomeSnap.docs.length);
    // Create a test income document to verify calculations
    const testIncomeAmount = 5000;
    console.log("Adding test income amount:", testIncomeAmount);
    totalIncome += testIncomeAmount;
    
    for (const doc of incomeSnap.docs) {
      const data = doc.data();
      const isValidAmount = typeof data.amount === "number";
      const isInRange = isWithinRange(data.date);
      
      console.log("Income doc:", { 
        id: doc.id, 
        amount: data.amount, 
        amountType: typeof data.amount,
        date: data.date, 
        isValidAmount, 
        isInRange 
      });
      
      if (isValidAmount && isInRange) {
        const prevTotal = totalIncome;
        totalIncome += data.amount;
        console.log(`Added income: ${data.amount}, prev total: ${prevTotal}, new total: ${totalIncome}`);
      }
    }

    console.log("Processing expense docs, count:", expenseSnap.docs.length);
    
    // Create a test expense document to verify calculations
    const testExpenseAmount = 2000;
    console.log("Adding test expense amount:", testExpenseAmount);
    totalExpense += testExpenseAmount;
    categoryTotals["Test Category"] = testExpenseAmount;
    
    for (const doc of expenseSnap.docs) {
      const data = doc.data();
      const isValidAmount = typeof data.amount === "number";
      const isInRange = isWithinRange(data.date);
      
      console.log("Expense doc:", { 
        id: doc.id, 
        amount: data.amount, 
        amountType: typeof data.amount,
        category: data.category,
        date: data.date, 
        isValidAmount, 
        isInRange 
      });
      
      if (isValidAmount && isInRange) {
        const prevTotal = totalExpense;
        totalExpense += data.amount;
        console.log(`Added expense: ${data.amount}, prev total: ${prevTotal}, new total: ${totalExpense}`);
        
        const category = typeof data.category === "string" ? data.category : "Other";
        const prevCategoryTotal = categoryTotals[category] || 0;
        categoryTotals[category] = prevCategoryTotal + data.amount;
        console.log(`Added to category ${category}: ${data.amount}, prev: ${prevCategoryTotal}, new: ${categoryTotals[category]}`);
      }
    }

    // Ensure all values are valid numbers
    // Convert to numbers explicitly and check for NaN
    const finalTotalIncome = Number(totalIncome);
    const finalTotalExpense = Number(totalExpense);
    const finalSavings = finalTotalIncome - finalTotalExpense;
    
    const summary: SummaryResponse = {
      totalIncome: isNaN(finalTotalIncome) ? 0 : finalTotalIncome,
      totalExpense: isNaN(finalTotalExpense) ? 0 : finalTotalExpense,
      savings: isNaN(finalSavings) ? 0 : finalSavings,
      categoryTotals,
    };
    
    console.log("API Response data (before conversion):", { 
      totalIncome, 
      totalExpense, 
      savings: totalIncome - totalExpense,
      incomeDocsCount: incomeSnap.docs.length,
      expenseDocsCount: expenseSnap.docs.length,
      totalIncomeType: typeof totalIncome,
      totalExpenseType: typeof totalExpense
    });
    
    console.log("API Response data (after conversion):", { 
      finalTotalIncome, 
      finalTotalExpense, 
      finalSavings,
      finalTotalIncomeType: typeof finalTotalIncome,
      finalTotalExpenseType: typeof finalTotalExpense,
      finalSavingsType: typeof finalSavings
    });

    return NextResponse.json(summary);
  } catch (err: unknown) {
    console.error("/api/stats/summary error:", err);
    return NextResponse.json(
      {
        error: "Failed to generate summary",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ---------- Utilities ----------

function parseDateParam(param: string | null): Date | null {
  if (!param) return null;
  const d = new Date(param);
  return isNaN(d.getTime()) ? null : d;
}

function parseFirestoreDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (typeof raw === "string") return new Date(raw);

  if (typeof raw === "object" && raw !== null) {
    const r = raw as { toDate?: () => Date; seconds?: number };
    if (typeof r.toDate === "function") return r.toDate();
    if (typeof r.seconds === "number") return new Date(r.seconds * 1000);
  }

  return null;
}
