"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ExpenseChart from "@/components/expense/ExpenseChart";
import ExpenseList from "@/components/expense/ExpenseList";
import AddExpenseForm from "@/components/expense/AddExpenseForm";

export default function ExpensePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black">
        {/* Page Header */}
        <header>
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <p className="text-sm text-gray-600">
            Track and manage your expenses efficiently.
          </p>
        </header>

        {/* Chart + Form Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 min-h-[300px]">
            <ExpenseChart refreshKey={refreshKey} />
          </div>
          <div className="min-h-[300px]">
            <AddExpenseForm onAdded={triggerRefresh} />
          </div>
        </section>

        {/* Expense Table/List */}
        <section>
          <ExpenseList refreshKey={refreshKey} />
        </section>
      </div>
    </DashboardLayout>
  );
}
