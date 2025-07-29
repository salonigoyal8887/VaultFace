// AddIncomeForm.tsx 

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
const SOURCE_OPTIONS = [
  "Salary",
  "Freelancing",
  "Investments Return",
  "Business",
  "Gift",
  "Other",
] as const;

// Clean amount string
const normalizeAmount = (raw: string): string => {
  return raw.replace(/(?<=\d),(?=\d)/g, "").trim();
};

// Detect source from raw OCR string
const detectIncomeSource = (text: string): string => {
  const lower = text.toLowerCase();
  if (/(salary|payslip|ctc|net pay)/.test(lower)) return "Salary";
  if (/(freelance|contract|gig)/.test(lower)) return "Freelancing";
  if (/(dividend|interest|roi|return|capital gain)/.test(lower)) return "Investments Return";
  if (/(business|invoice|sales|revenue)/.test(lower)) return "Business";
  if (/(gift|present|donation)/.test(lower)) return "Gift";
  return "Other";
};

// Safe JSON parse from API response
const safeParseJson = async <T = unknown>(res: Response): Promise<T | null> => {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
};

interface AddIncomeFormProps {
  onAdded?: () => void;
}

export default function AddIncomeForm({ onAdded }: AddIncomeFormProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCustomSource = source === "Other";

  // Upload handler for both image and PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return toast.error("Please select a file");

    setAmount("");
    setIsExtracting(true);

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/amount-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: file.type }),
        });

        const data = await safeParseJson<{
          amount?: number;
          source?: string;
          modelRaw?: string;
        }>(res);

        if (!res.ok || !data) {
          toast.error("Extraction failed");
          return;
        }

        if (data.amount != null) {
          setAmount(normalizeAmount(data.amount.toString()));
          setSource(data.source || detectIncomeSource(data.modelRaw || ""));
          setDate(new Date());
          toast.success("Amount extracted");
        } else {
          toast.warning("Amount not detected. Enter manually.");
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  // Submit income form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSource = isCustomSource ? customSource.trim() : source;
    if (!amount || !finalSource || !date) {
      toast.error("All fields are required.");
      return;
    }

    const parsedAmount = parseFloat(normalizeAmount(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount > 0");
      return;
    }

    if (!user) {
      toast.error("Login required");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "incomes"), {
        amount: parsedAmount,
        source: finalSource,
        date: date.toISOString(),
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast.success("Income saved");
      setAmount("");
      setSource("");
      setCustomSource("");
      setDate(new Date());
      onAdded?.();
    } catch (err) {
      console.error("Add income failed:", err);
      toast.error("Failed to add income");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#161b33] text-white border-none">
      <CardHeader>
        <CardTitle className="text-xl">Add New Income</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-1">
            <Label>Upload Payslip / Income Proof (optional)</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              disabled={isExtracting || isSubmitting}
              className="text-white file:text-white file:bg-[#1f2547] file:border-none"
            />
            {isExtracting && <p className="text-sm animate-pulse text-indigo-300">Extracting...</p>}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="amount">Amount (₹)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                className="bg-[#1f2547] pl-10"
              />
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
            </div>
          </div>

          {/* Source */}
          <div className="space-y-1">
            <Label htmlFor="source">Source</Label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#1f2547] text-white border px-3 py-2 rounded"
            >
              <option value="">Select Source</option>
              {SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {isCustomSource && (
              <div className="space-y-1 mt-2">
                <Label htmlFor="customSource">Custom Source</Label>
                <Input
                  id="customSource"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-[#1f2547] border text-white"
                />
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d)}
                className="bg-[#1f2547] text-white w-full py-2 px-3 rounded border pl-10"
                placeholderText="Select a date"
                disabled={isSubmitting}
              />
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-pink-400" />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || isExtracting}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Add Income"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
