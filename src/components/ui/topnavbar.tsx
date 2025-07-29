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
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function TopNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black text-white shadow-md h-14">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight">VaultFace</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1 font-medium transition border-b-2 border-transparent hover:border-primary"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link
                href="/income"
                className="flex items-center gap-2 px-3 py-1 font-medium transition border-b-2 border-transparent hover:border-primary"
              >
                <IndianRupee className="w-4 h-4" />
                <span className="font-medium">Income</span>
              </Link>
              <Link
                href="/expense"
                className="flex items-center gap-2 px-3 py-1 font-medium transition border-b-2 border-transparent hover:border-primary"
              >
                <TrendingDown className="w-4 h-4" />
                <span className="font-medium">Expenses</span>
              </Link>
              {/* <Link
                href="/statistics"
                className="flex items-center gap-2 px-3 py-1 font-medium transition border-b-2 border-transparent hover:border-primary"
              >
                <BarChart2 className="w-4 h-4" />
                <span className="font-medium">Statistics</span>
              </Link> */}
              <Link
                href="/upload-transactions"
                className="flex items-center gap-2 px-3 py-1 font-medium transition border-b-2 border-transparent hover:border-primary"
              >
                <FileUp className="w-4 h-4" />
                <span className="font-medium">Upload Statement</span>
              </Link>
            </div>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="hidden md:flex items-center gap-2 px-3 py-1 font-medium transition border-b-2 border-transparent hover:border-primary"
            >
              <User className="w-4 h-4" />
              <span className="font-medium">Account</span>
            </Link>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3 py-1 font-medium transition border-b-2 border-transparent hover:border-primary"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign out</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md bg-gray-800 text-white"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-black border-t border-gray-800">
            <div className="container mx-auto px-4 py-2 space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-teal-800"
                onClick={toggleMenu}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/income"
                className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-teal-800"
                onClick={toggleMenu}
              >
                <IndianRupee className="w-5 h-5" />
                Manage Income
              </Link>
              <Link
                href="/expense"
                className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-teal-800"
                onClick={toggleMenu}
              >
                <TrendingDown className="w-5 h-5" />
                Manage Expenses
              </Link>
              <Link
                href="/upload-transactions"
                className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-teal-800"
                onClick={toggleMenu}
              >
                <FileUp className="w-5 h-5" />
                Upload Transactions
              </Link>
              <Link
                href="/statistics"
                className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-teal-800"
                onClick={toggleMenu}
              >
                <BarChart2 className="w-5 h-5" />
                Statistics
              </Link>
              <Link
                href="/account"
                className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-teal-800"
                onClick={toggleMenu}
              >
                <User className="w-5 h-5" />
                Account
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-teal-800"
                onClick={toggleMenu}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition hover:bg-teal-800 text-left"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Overlay when mobile menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMenu}
        />
      )}
    </>
  );
}

export { TopNavbar };