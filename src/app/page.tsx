"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen w-full text-black overflow-hidden flex flex-col">
      {/* Background Grid */}
      <InteractiveGridPattern
        className={cn(
          "absolute inset-0 -z-10 opacity-80",
          "[mask-image:radial-gradient(700px_circle_at_center,white,transparent)]"
        )}
        width={20}
        height={20}
        squares={[80, 80]}
        squaresClassName="fill-gray-300/50 hover:fill-blue-500"
      />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl w-full text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Welcome to <span className="text-purple-500">Finance-typeface</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700">
            Your AI-powered personal finance assistant — track your income, control your expenses,
            gain financial insights, and plan better with ease.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-6 py-2 rounded-full shadow-lg">
                  🚀 Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-6 py-2 rounded-full shadow-lg">
                    ✍️ Register to Track Expenses
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-100 text-lg px-6 py-2 rounded-full shadow-sm">
                    🔐 Already have an account? Login
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Feature Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {[
              { emoji: "📈", title: "Track Income & Expenses", desc: "Monitor your daily, monthly, and yearly financial transactions." },
              { emoji: "🧠", title: "AI-Powered Insights", desc: "Get intelligent suggestions based on your spending patterns." },
              { emoji: "📊", title: "Visual Analytics", desc: "Beautiful charts for trends, categories, and savings." },
              { emoji: "🧾", title: "Receipt OCR", desc: "Scan receipts and upload PDFs to auto-extract transactions." },
              { emoji: "📤", title: "Export to PDF", desc: "Generate your own financial statement anytime." },
              { emoji: "🔐", title: "Secure Cloud Backup", desc: "All your data stored securely using Firebase." },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-1">
                  <span>{feature.emoji}</span> {feature.title}
                </h3>
                <p className="text-sm text-gray-700">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-600 relative z-10 border-t border-gray-200">
        Developed by <span className="font-medium">Finance-typeface Team</span> — <span className="text-purple-600 font-semibold">Ojaswa Varshney</span>
      </footer>
    </div>
  );
}
