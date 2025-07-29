// IncomeList.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Income {
  id: string;
  source: string;
  amount: number;
  category?: string;
  date: string; // ISO format
}

const formatDate = (raw: Timestamp | string | undefined): string => {
  if (!raw) return "Unknown Date";
  let dateObj: Date;

  if (raw instanceof Timestamp) {
    dateObj = raw.toDate();
  } else if (typeof raw === "string") {
    dateObj = new Date(raw);
  } else {
    return "Unknown Date";
  }

  return isNaN(dateObj.getTime())
    ? "Unknown Date"
    : dateObj.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
};

export default function IncomeList({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user, loading: authLoading } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchIncomes = async () => {
      setLoading(true);

      try {
        const q = query(
          collection(db, "incomes"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);

        const data: Income[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            source: d.source || "Unknown",
            category: d.category,
            amount: Number(d.amount) || 0,
            date: typeof d.date === "string"
              ? d.date
              : d.date instanceof Timestamp
              ? d.date.toDate().toISOString()
              : "",
          };
        });

        setIncomes(data);
      } catch (error) {
        console.error("Error fetching incomes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncomes();
  }, [user, authLoading, refreshKey]);

  return (
    <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border h-full overflow-hidden">
      <CardContent className="p-4 h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Latest incomes</h2>
        </div>

        <ScrollArea className="h-[400px] pr-2 overflow-auto">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md bg-muted/50" />
              ))}
            </div>
          ) : incomes.length > 0 ? (
            <ul className="space-y-4">
              {incomes.map(({ id, source, category, amount, date }) => (
                <li
                  key={id}
                  className="flex justify-between items-center bg-primary/5 px-4 py-3 rounded-lg hover:bg-primary/10 transition-all duration-200"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {source || category || "Misc"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(date)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-accent border-accent/20 bg-accent/10"
                  >
                    ₹{amount}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V3M17 8L12 3M12 3L7 8M12 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50" />
              </svg>
              <p className="text-sm text-muted-foreground">
                No income records found
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
