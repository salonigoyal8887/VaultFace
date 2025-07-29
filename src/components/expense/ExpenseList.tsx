// ExpenseList.tsx

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string; // ISO string format
}

const formatDate = (raw: Timestamp | string | number | undefined): string => {
  if (!raw) return "Unknown Date";

  let dateObj: Date | null = null;
  if (raw instanceof Timestamp) {
    dateObj = raw.toDate();
  } else if (typeof raw === "string" || typeof raw === "number") {
    dateObj = new Date(raw);
  }

  if (!dateObj || isNaN(dateObj.getTime())) return "Unknown Date";

  return dateObj.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default function ExpenseList({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestExpenses = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const q = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        );
        const snapshot = await getDocs(q);

        const formatted: Expense[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            category: data.category || "Misc",
            amount: Number(data.amount) || 0,
            date: formatDate(data.date),
          };
        });

        setExpenses(formatted);
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestExpenses();
  }, [user, refreshKey]);

  return (
    <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border h-full overflow-hidden">
      <CardContent className="p-4 h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Latest expenses</h2>
        </div>

        <ScrollArea className="h-[400px] pr-2 overflow-auto">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md bg-muted/50" />
              ))}
            </div>
          ) : expenses.length > 0 ? (
            <ul className="space-y-4">
              {expenses.map(({ id, category, amount, date }) => (
                <li
                  key={id}
                  className="flex justify-between items-center bg-primary/5 px-4 py-3 rounded-lg hover:bg-primary/10 transition-all duration-200"
                >
                  <div>
                    <p className="text-sm font-medium">{category}</p>
                    <p className="text-xs text-muted-foreground">{date}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-red-600 border-red-200 bg-red-50"
                  >
                    ₹{amount}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50" />
                <path d="M16 14H8M12 10V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50" />
              </svg>
              <p className="text-sm text-muted-foreground">
                No expense records found
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
