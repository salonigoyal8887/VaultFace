// AddIncomeForm.tsx 

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, IndianRupee, TrendingUp, Briefcase, FileIcon, Upload } from "lucide-react";
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
    <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2 flex items-center justify-center">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <span>Add new income</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-muted-foreground flex items-center gap-2">
              <IndianRupee size={14} /> Amount
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                placeholder="0.00"
                className="bg-muted/50 text-foreground border focus:border-primary pl-10"
              />
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source" className="text-muted-foreground flex items-center gap-2">
              <Briefcase size={14} /> Source
            </Label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2 rounded-md bg-muted/50 text-foreground border border-input focus:border-primary"
            >
              <option value="">Select source</option>
              {SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {isCustomSource && (
              <div className="space-y-2">
                <Label htmlFor="customSource" className="text-muted-foreground">Custom source</Label>
                <Input
                  id="customSource"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Enter source"
                  className="bg-muted/50 text-foreground border focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-muted-foreground flex items-center gap-2">
              <CalendarIcon size={14} /> Date
            </Label>
            <div className="relative">
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d)}
                disabled={isSubmitting}
                className="w-full p-2 rounded-md bg-muted/50 text-foreground border border-input focus:border-primary pl-10"
                placeholderText="Select a date"
                dateFormat="MMMM d, yyyy"
              />
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="proof" className="text-muted-foreground flex items-center gap-2">
              <FileIcon size={14} /> Upload proof (optional)
            </Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="proof"
                className="flex flex-col items-center justify-center w-full h-32 border border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-all"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-primary/70" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground/70">PDF, PNG, JPG (MAX. 10MB)</p>
                </div>
                <input
                  id="proof"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isExtracting}
                />
              </label>
            </div>
            {isExtracting && (
              <div className="text-center text-muted-foreground text-sm mt-2 animate-pulse">
                Extracting data from proof...
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isExtracting}
            className="w-full mt-2 bg-primary hover:bg-primary/90 text-white disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Add income"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
