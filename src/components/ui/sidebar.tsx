"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  BarChart2,
  IndianRupee,
  TrendingDown,
  User,
  Settings,
  Menu,
  X,
  FileUp,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Toggle Button (Visible on small screens) */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-[#1a1c3b] text-white shadow-md"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed z-40 lg:static top-0 left-0 h-full w-64 bg-gradient-to-b from-[#0e0f23] to-[#1a1c3b] text-white flex flex-col p-6 shadow-lg border-r border-gray-800 transition-transform duration-300 ease-in-out",
          {
            "-translate-x-full": !isOpen,
            "translate-x-0": isOpen,
            "lg:translate-x-0": true,
          }
        )}
      >
        <Link href="/">
        <div className="mb-10 flex flex-col items-start">
         <h1 className="text-2xl font-extrabold tracking-tight">💸 Finance-typeface</h1>
          <p className="text-xs text-muted-foreground">Your Finance Assistant</p>
        </div>
        </Link> 
        <nav className="flex-1 space-y-4 text-sm">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-blue-600/20 hover:text-blue-400"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/income"
            className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-green-600/20 hover:text-green-400"
          >
            <IndianRupee className="w-5 h-5" />
            Manage Income
          </Link>
          <Link
            href="/expense"
            className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-red-600/20 hover:text-red-400"
          >
            <TrendingDown className="w-5 h-5" />
            Manage Expenses
          </Link>
          <Link
            href="/upload-transactions"
            className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-purple-600/20 hover:text-purple-400"
          >
            <FileUp className="w-5 h-5" />
            Upload Bank Statement / Transactions
          </Link>
          <Link
            href="/statistics"
            className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-yellow-600/20 hover:text-yellow-400"
          >
            <BarChart2 className="w-5 h-5" />
            Statistics
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 text-sm space-y-3">
          <Link
            href="/account"
            className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-white/10 hover:text-white"
          >
            <User className="w-5 h-5" />
            Account
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-white/10 hover:text-white"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Overlay when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}

export { Sidebar };
