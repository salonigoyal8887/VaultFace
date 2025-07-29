// AddExpenseForm.tsx

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, IndianRupee, Receipt, Folder as FolderIcon, FileText as FileIcon, Upload } from "lucide-react";
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
    <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2 flex items-center justify-center">
            <Receipt size={18} className="text-primary" />
          </div>
          <span>Add new expense</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-muted-foreground flex items-center gap-2">
              <IndianRupee size={14} /> Amount
            </Label>
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

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-muted-foreground flex items-center gap-2">
              <FolderIcon size={14} /> Category
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2 rounded-md bg-muted/50 text-foreground border border-input focus:border-primary"
            >
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {showCustomInput && (
            <div className="space-y-2">
              <Label htmlFor="customCategory" className="text-muted-foreground">Custom Category</Label>
              <Input
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter category"
                className="bg-muted/50 text-foreground border focus:border-primary"
              />
            </div>
          )}

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
            <Label htmlFor="receipt" className="text-muted-foreground flex items-center gap-2">
              <FileIcon size={14} /> Upload receipt (optional)
            </Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="receipt"
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
                  id="receipt"
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
                Extracting data from receipt...
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isExtracting}
            className="w-full mt-2 bg-primary hover:bg-primary/90 text-white disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Add expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}