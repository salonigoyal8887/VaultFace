"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import TotalBalanceCard from "@/components/dashboard/TotalBalanceCard";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";
import InsightSummaryCard from "@/components/dashboard/InsightSummaryCard";
import SpendingCategoryChart from "@/components/dashboard/SpendingCategoryChart";
import LatestTransactionsTable from "@/components/dashboard/LatestTransactionsTable";
import SavingsTrendChart from "@/components/dashboard/SavingsTrendChart";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
  const { user } = useAuth();
  const now = new Date();
  const currentYear = now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [userName, setUserName] = useState<string>("User");
  const [currentExpenses, setCurrentExpenses] = useState<number>(0);

  const years = generateYears(2020, currentYear + 5);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || "User");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch current month expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) return;
      
      try {
        const expenseQuery = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid)
        );
        const expenseSnap = await getDocs(expenseQuery);
        
        let total = 0;
        expenseSnap.forEach((doc) => {
          const data = doc.data();
          const dt = data.date?.seconds
            ? new Date(data.date.seconds * 1000)
            : new Date(data.date);

          if (dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth) {
            total += Number(data.amount || 0);
          }
        });
        
        setCurrentExpenses(total);
      } catch (err) {
        console.error("Error fetching expenses:", err);
      }
    };
    
    fetchExpenses();
  }, [user, selectedMonth, selectedYear]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 text-black">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 rounded-lg shadow-md mb-6 w-full">
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-full">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white"/>
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="white"/>
                <path d="M12 6C11.45 6 11 6.45 11 7V8C11 8.55 11.45 9 12 9C12.55 9 13 8.55 13 8V7C13 6.45 12.55 6 12 6Z" fill="white"/>
                <path d="M12 15C11.45 15 11 15.45 11 16V17C11 17.55 11.45 18 12 18C12.55 18 13 17.55 13 17V16C13 15.45 12.55 15 12 15Z" fill="white"/>
                <path d="M17 11H16C15.45 11 15 11.45 15 12C15 12.55 15.45 13 16 13H17C17.55 13 18 12.55 18 12C18 11.45 17.55 11 17 11Z" fill="white"/>
                <path d="M8 11H7C6.45 11 6 11.45 6 12C6 12.55 6.45 13 7 13H8C8.55 13 9 12.55 9 12C9 11.45 8.55 11 8 11Z" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                Welcome back, {userName}!
              </h1>
              <p className="text-base text-white/90 max-w-2xl">
                Track your income, control your spending, and build your savings — all in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="text-base md:text-lg mt-2 flex flex-wrap items-center gap-1">
          <span>Showing insights and trends for Month</span>

          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(Number(val))}
          >
            <SelectTrigger className="underline underline-offset-4 px-1 py-0 bg-transparent border-none text-teal-600 font-medium h-auto w-auto focus:ring-0 focus:outline-none hover:text-teal-500">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black border border-teal-200 shadow-lg">
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
            <SelectTrigger className="underline underline-offset-4 px-1 py-0 bg-transparent border-none text-teal-600 font-medium h-auto w-auto focus:ring-0 focus:outline-none hover:text-teal-500">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black border border-teal-200 shadow-lg">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dashboard Layout - Reorganized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Right Column - Expenses Card with bigger font and scrollable content - Now First on Mobile */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-auto lg:h-[calc(100vh-200px)] lg:sticky lg:top-20 order-first">
            <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border p-4 mb-4">
              <CardContent>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="bg-red-100 rounded-full p-2 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ef4444" strokeWidth="2"/>
                      <path d="M15 12H9" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span>Expenses</span>
                </h2>
                <div className="text-4xl font-bold mb-2 text-red-600">₹{currentExpenses || 0}</div>
                <p className="text-sm text-muted-foreground">This Month</p>
              </CardContent>
            </Card>
            
            <div className="overflow-y-auto flex-grow h-[400px] lg:h-auto">
              <LatestTransactionsTable month={selectedMonth} year={selectedYear} />
            </div>
          </div>
          
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-6 order-last lg:order-none">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <TotalBalanceCard month={selectedMonth} year={selectedYear} />
              </div>
              <div className="md:col-span-1">
                <InsightSummaryCard month={selectedMonth} year={selectedYear} />
              </div>
            </div>
            
            {/* Middle Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <IncomeExpenseChart year={selectedYear} />
              </div>
              <div className="md:col-span-1 h-[400px]">
                <SpendingCategoryChart month={selectedMonth} year={selectedYear} />
              </div>
              <div className="md:col-span-1 h-[400px]">
                <SavingsTrendChart year={selectedYear} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
