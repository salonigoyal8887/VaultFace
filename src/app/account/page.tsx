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
  LineChart,
  Lightbulb,
  AlertTriangle,
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
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile and learn about VaultFace's AI capabilities.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Section */}
          <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-3 flex items-center justify-center">
                  <UserIcon size={24} className="text-primary" />
                </div>
                <span>Your Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Email and Display Name in 2 columns on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={16} /> Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={currentUser.email || ""}
                    readOnly
                    className="bg-muted/50 text-foreground border cursor-not-allowed"
                  />
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2 text-muted-foreground">
                    <UserIcon size={16} /> Display Name
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      readOnly={!isEditing}
                      className={`bg-muted/50 text-foreground ${!isEditing ? "cursor-text" : ""}`}
                    />
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleUpdateName}
                          disabled={loading}
                          title="Save"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Save size={18} />
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
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle size={18} />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                        disabled={loading}
                        title="Edit"
                        className="text-primary hover:text-primary/80"
                      >
                        <Pencil size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Capabilities Section */}
          <Card className="bg-white text-foreground shadow-sm hover:shadow transition-all duration-200 border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-3 flex items-center justify-center">
                  <Sparkles size={24} className="text-primary" />
                </div>
                <span>About VaultFace AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-6">
                {/* Intelligent Insights */}
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <LineChart size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Intelligent insights</h3>
                    <p className="text-sm text-muted-foreground">Analyze monthly trends in your finances.</p>
                  </div>
                </div>

                {/* Personalized Tips */}
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Lightbulb size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Personalized tips</h3>
                    <p className="text-sm text-muted-foreground">Optimize your budget and reach goals faster.</p>
                  </div>
                </div>

                {/* Anomaly Detection */}
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <AlertTriangle size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Anomaly detection</h3>
                    <p className="text-sm text-muted-foreground">Spot suspicious or abnormal spending patterns.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
