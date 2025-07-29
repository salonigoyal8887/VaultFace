// app/income/page.tsx
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import AddIncomeForm from "@/components/income/AddIncomeForm";
import IncomeList from "@/components/income/IncomeList";
import IncomeChart from "@/components/income/IncomeChart";
import { useState } from "react";

export default function IncomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold ">Income Management</h1>
          <p className="text-sm text-muted-foreground">
            View, add, and analyze your income sources
          </p>
        </div>

        {/* Charts + Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <IncomeChart refreshKey={refreshKey}/>
          </div>
          <AddIncomeForm onAdded={() => setRefreshKey((prev) => prev + 1)} />
        </div>

        {/* Latest Incomes */}
        <IncomeList refreshKey={refreshKey} />
      </div>
    </DashboardLayout>
  );
}
