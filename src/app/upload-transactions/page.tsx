"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "CR" | "DR";
  classifiedAs: "Income" | "Expense";
}

export default function UploadTransactionsPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<ExtractedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file.");

    const formData = new FormData();
    formData.append("receipt", file);
    setLoading(true);

    try {
      const res = await fetch("/api/file-transaction", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions as ExtractedTransaction[]);
      } else {
        alert(data.error || "Failed to extract transactions.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Something went wrong while extracting transactions.");
    } finally {
      setLoading(false);
    }
  };

  const guessExpenseCategory = (desc: string = "") => {
    const lower = desc.toLowerCase();
    if (lower.includes("zomato") || lower.includes("swiggy")) return "Food";
    if (lower.includes("amazon") || lower.includes("flipkart")) return "Shopping";
    if (lower.includes("atm") || lower.includes("withdrawal")) return "Cash";
    if (lower.includes("rent")) return "Housing";
    if (lower.includes("electricity") || lower.includes("bill")) return "Utilities";
    return "Misc";
  };

  const isValidDate = (input: unknown): boolean => {
    const parsed = new Date(input as string);
    return parsed instanceof Date && !isNaN(parsed.valueOf());
  };

  const handleSaveToFirebase = async () => {
    if (!user || transactions.length === 0) return;
    setSaving(true);

    try {
      for (const tx of transactions) {
        const doc = {
          amount: Math.abs(tx.amount),
          category:
            tx.classifiedAs === "Income"
              ? "Salary"
              : guessExpenseCategory(tx.description),
          date: isValidDate(tx.date) ? new Date(tx.date) : new Date(),
          createdAt: serverTimestamp(),
          userId: user.uid,
        };

        const collectionName =
          tx.classifiedAs.toLowerCase() === "income" ? "incomes" : "expenses";

        await addDoc(collection(db, collectionName), doc);
      }

      alert("Transactions saved successfully.");
      setTransactions([]);
      setFile(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save transactions.");
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = (type: "Income" | "Expense") =>
    transactions
      .filter((tx) => tx.classifiedAs === type)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
      .toFixed(2);

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold">Upload Bank Statement</h1>
          <p className="text-sm text-gray-600">
            Upload a PDF, Excel, or CSV file and extract transactions using AI
          </p>
        </header>

        <Card className="shadow-md border border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
              <div className="w-full">
                <Input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full file:text-white file:bg-primary file:border-none"
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="bg-primary hover:bg-primary/90 text-white px-6 w-full md:w-auto"
              >
                {loading ? "Extracting..." : "Upload Statement"}
              </Button>
            </div>

            {transactions.length > 0 ? (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Extracted Transactions
                  </h3>
                  <div className="flex gap-4 text-sm">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                      Income: ₹{totalAmount("Income")}
                    </span>
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-md font-medium">
                      Expenses: ₹{totalAmount("Expense")}
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="max-h-[400px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-700 font-medium sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Description</th>
                          <th className="px-4 py-3 text-left">Amount</th>
                          <th className="px-4 py-3 text-left">Type</th>
                          <th className="px-4 py-3 text-left">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {transactions.map((tx, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50 transition duration-150"
                          >
                            <td className="px-4 py-3">{tx.date}</td>
                            <td className="px-4 py-3">{tx.description}</td>
                            <td className="px-4 py-3 font-medium">
                              ₹{Math.abs(tx.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tx.type === "CR"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {tx.type === "CR" ? "Credit" : "Debit"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tx.classifiedAs === "Income"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {tx.classifiedAs}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSaveToFirebase}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? "Saving..." : "Save All to Database"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-6 text-center">
                No transactions extracted yet. Upload a statement to begin.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
