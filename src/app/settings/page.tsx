"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function UploadTransactionsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-10 text-center">
        <Card className="bg-[#161b33]">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-white mb-4">🚧 Upload Transactions</h1>
            <p className="text-muted-foreground text-lg">
              This feature is <span className="text-yellow-400 font-semibold">Work in Progress</span>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Soon you&apos;ll be able to upload your PDF/Excel/CSV bank statements and automatically extract &amp; classify all your transactions using AI.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
