"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import TotalBalanceCard from "@/components/dashboard/TotalBalanceCard";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";
import InsightSummaryCard from "@/components/dashboard/InsightSummaryCard";
import SpendingCategoryChart from "@/components/dashboard/SpendingCategoryChart";
import LatestTransactionsTable from "@/components/dashboard/LatestTransactionsTable";
import SavingsTrendChart from "@/components/dashboard/SavingsTrendChart";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------- Constants ----------
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const generateYears = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

// ---------- Main Component ----------
export default function DashboardPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [userName, setUserName] = useState<string>("User");

  const years = generateYears(2020, currentYear + 5);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || "User");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 text-foreground">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          👋 Welcome back, {userName}!
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Welcome to <span className="font-semibold text-purple-300">Finance-typeface</span>, your personal finance assistant. Track your income, control your spending, and build your savings — all in one place.
        </p>

        {/* Filters */}
        <div className="text-base md:text-lg mt-2 flex flex-wrap items-center gap-1">
          <span>Showing insights and trends for Month</span>

          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(Number(val))}
          >
            <SelectTrigger className="underline underline-offset-4 px-1 py-0 bg-transparent border-none text-purple-400 font-medium h-auto w-auto focus:ring-0 focus:outline-none hover:text-purple-800">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f2547] text-white border border-white/10 shadow-lg">
              {MONTHS.map((month, idx) => (
                <SelectItem key={month} value={idx.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span>, Year</span>

          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="underline underline-offset-4 px-1 py-0 bg-transparent border-none text-purple-400 font-medium h-auto w-auto focus:ring-0 focus:outline-none hover:text-purple-800">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f2547] text-white border border-white/10 shadow-lg">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dashboard Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TotalBalanceCard month={selectedMonth} year={selectedYear} />
          <IncomeExpenseChart year={selectedYear} />
          <InsightSummaryCard month={selectedMonth} year={selectedYear} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SpendingCategoryChart month={selectedMonth} year={selectedYear} />
          <LatestTransactionsTable month={selectedMonth} year={selectedYear} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <SavingsTrendChart year={selectedYear} />
        </div>
      </div>
    </DashboardLayout>
  );
}
