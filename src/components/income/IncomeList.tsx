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
    <Card className="bg-[#161b33] text-white h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Latest Income</h2>
        </div>

        <ScrollArea className="h-[220px] pr-2">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md bg-muted/30" />
              ))}
            </div>
          ) : incomes.length > 0 ? (
            <ul className="space-y-4">
              {incomes.map(({ id, source, category, amount, date }) => (
                <li
                  key={id}
                  className="flex justify-between items-center bg-[#1f2547] px-4 py-2 rounded-lg hover:bg-[#23294e] transition"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {source || category || "Misc"}
                    </p>
                    <p className="text-xs text-purple-300 text-muted-foreground">
                      {formatDate(date)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-green-400 border-green-500 bg-transparent"
                  >
                    ₹{amount}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No income records found.
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
