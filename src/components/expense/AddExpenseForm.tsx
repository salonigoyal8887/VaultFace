// AddExpenseForm.tsx

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, IndianRupee } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Constants
const CATEGORY_OPTIONS = [
  "Groceries",
  "Food",
  "Travel",
  "Rent",
  "Shopping",
  "Bills",
  "Medical",
  "Entertainment",
  "Misc",
  "Other",
] as const;

// Detect category from raw OCR string
function detectExpenseCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/(grocery|supermarket|mart)/.test(lower)) return "Groceries";
  if (/(restaurant|food|cafe|dine)/.test(lower)) return "Food";
  if (/(uber|ola|travel|taxi|flight|train|bus)/.test(lower)) return "Travel";
  if (/rent/.test(lower)) return "Rent";
  if (/shopping|store|mall/.test(lower)) return "Shopping";
  if (/medical|pharma|hospital|clinic/.test(lower)) return "Medical";
  if (/bill|electricity|water|utility|internet/.test(lower)) return "Bills";
  if (/movie|entertainment|netflix|spotify|show/.test(lower)) return "Entertainment";
  return "Misc";
}

// Clean amount string
function normalizeAmount(raw: string): string {
  return raw.replace(/(?<=\d),(?=\d)/g, "").trim();
}

// Safe JSON parse from API response
async function safeParseJson<T = unknown>(res: Response): Promise<T | null> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

interface AddExpenseFormProps {
  onAdded?: () => void;
}

export default function AddExpenseForm({ onAdded }: AddExpenseFormProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showCustomInput = category === "Other" || category === "Misc";

  // Upload handler for both image and PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return toast.error("Please select a file");

    setIsExtracting(true);
    setCategory("");
    setCustomCategory("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/amount-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: file.type }),
        });

        const data = await safeParseJson<{ amount?: number; modelRaw?: string }>(res);

        if (!res.ok || !data) return toast.error("Extraction failed");

        if (data.amount) {
          setAmount(normalizeAmount(data.amount.toString()));
          setCategory(detectExpenseCategory(data.modelRaw || ""));
          setDate(new Date());
          toast.success("Details extracted successfully");
        } else {
          toast.warning("Amount not detected. Enter manually.");
        }
      } catch (err) {
        console.error("File extract error:", err);
        toast.error("Extraction failed");
      } finally {
        setIsExtracting(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // submit expense form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = showCustomInput ? customCategory.trim() : category;
    const numericAmount = parseFloat(normalizeAmount(amount));

    if (!amount || !finalCategory || !date) return toast.error("All fields are required.");
    if (isNaN(numericAmount) || numericAmount <= 0) return toast.error("Enter a valid amount > 0");
    if (showCustomInput && !customCategory.trim()) return toast.error("Please enter custom category");
    if (!user) return toast.error("Login required");

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "expenses"), {
        amount: numericAmount,
        category: finalCategory,
        date: date.toISOString(),
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast.success("Expense saved");
      setAmount("");
      setCategory("");
      setCustomCategory("");
      setDate(new Date());
      onAdded?.();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#161b33] text-white border-none">
      <CardHeader>
        <CardTitle className="text-xl">Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Upload Receipt (optional)</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              disabled={isExtracting || isSubmitting}
              className="text-white file:text-white file:bg-[#1f2547] file:border-none"
            />
            {isExtracting && <p className="text-sm animate-pulse text-indigo-300">Extracting...</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount">Amount (₹)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                placeholder="0.00"
                className="bg-[#1f2547] border pl-10"
              />
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="bg-[#1f2547] border w-full py-2 px-3 rounded"
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {showCustomInput && (
            <div className="space-y-1">
              <Label htmlFor="customCategory">Custom Category</Label>
              <Input
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter category"
                className="bg-[#1f2547] border text-white"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d)}
                disabled={isSubmitting}
                className="bg-[#1f2547] text-white w-full py-2 px-3 rounded border pl-10"
                placeholderText="Select a date"
              />
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-pink-400" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isExtracting}
            className="w-full mt-2 bg-pink-600 hover:bg-pink-700 text-white"
          >
            {isSubmitting ? "Saving..." : "Add Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}