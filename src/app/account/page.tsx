"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  updateProfile,
  signOut,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  LogOut,
  User as UserIcon,
  Mail,
  Pencil,
  Save,
  XCircle,
  Brain,
  Sparkles,
} from "lucide-react";

import DashboardLayout from "@/components/layouts/DashboardLayout";

// ---------- Main Component ----------
export default function AccountPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---------- Auth State Sync ----------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return router.push("/login");
      setCurrentUser(user);
      setDisplayName(user.displayName || "");
    });
    return () => unsubscribe();
  }, [router]);

  // ---------- Update Name ----------
  const handleUpdateName = async () => {
    if (!currentUser) return toast.error("No user logged in.");
    const trimmed = displayName.trim();
    if (!trimmed) return toast.error("Display name cannot be empty.");
    if (trimmed === currentUser.displayName) return setIsEditing(false);

    setLoading(true);
    try {
      await updateProfile(currentUser, { displayName: trimmed });
      toast.success("Display name updated!");
      setIsEditing(false);
    } catch (err) {
      toast.error(`Update failed: ${(err as Error).message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast.success("Logged out!");
      router.push("/login");
    } catch (err) {
      toast.error(`Logout failed: ${(err as Error).message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Loading Fallback ----------
  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[calc(100vh-100px)] items-center justify-center text-gray-400">
          Loading user data...
        </div>
      </DashboardLayout>
    );
  }

  // ---------- Render ----------
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 text-foreground p-4 md:p-6">
        <header>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-md text-muted-foreground">
            Manage your profile and learn about VaultFace's AI capabilities.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Section */}
          <Card className="bg-[#161b33] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon size={20} /> Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground text-white">
                  <Mail size={16} /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser.email || ""}
                  readOnly
                  className="bg-[#1f2547] text-white border-none cursor-not-allowed"
                />
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-2 text-muted-foreground text-white">
                  <UserIcon size={16} /> Display Name
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    readOnly={!isEditing}
                    className={`bg-[#1f2547] text-white border-none ${!isEditing ? "cursor-text" : ""}`}
                  />
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleUpdateName}
                        disabled={loading}
                        title="Save"
                        className="text-green-400 hover:text-green-500"
                      >
                        <Save size={20} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(currentUser.displayName || "");
                        }}
                        disabled={loading}
                        title="Cancel"
                        className="text-red-400 hover:text-red-500"
                      >
                        <XCircle size={20} />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      disabled={loading}
                      title="Edit"
                      className="text-blue-400 hover:text-blue-500"
                    >
                      <Pencil size={20} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Logout */}
              <div className="pt-4 border-t border-white/10 flex justify-center">
                <Button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-fit px-6 py-2 bg-red-600 hover:bg-red-700 flex items-center gap-2 rounded-md"
                >
                  <LogOut size={18} />
                  {loading ? "Logging Out..." : "Logout"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Description */}
          <Card className="bg-[#161b33] text-white flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain size={20} className="text-purple-400" /> About VaultFace AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow text-sm text-white">
              <p className="text-muted-foreground">
                VaultFace is powered by advanced AI to give you smart, personalized financial insights.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li className="flex gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span><strong className="text-purple-400">Intelligent Insights:</strong> Analyze monthly trends in your finances.</span>
                </li>
                <li className="flex gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span><strong className="text-purple-400">Personalized Tips:</strong> Optimize your budget and reach goals faster.</span>
                </li>
                <li className="flex gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span><strong className="text-purple-400">Anomaly Detection:</strong> Spot suspicious or abnormal spending patterns.</span>
                </li>
              </ul>
              <p className="text-muted-foreground">
                We&apos;re continuously enhancing VaultFace&apos;s capabilities to better serve you.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
