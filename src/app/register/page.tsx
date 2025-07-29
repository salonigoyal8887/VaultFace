"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      toast.error("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);

      await updateProfile(userCredential.user, {
        displayName: trimmedName,
      });

      toast.success("Registration successful!");
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md space-y-6 rounded-xl border p-6 shadow-lg bg-white"
      >
        <h1 className="text-2xl font-bold text-center text-black">Register for VaultFace</h1>

        {/* Full Name */}
        <Input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />

        {/* Email */}
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {/* Password */}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-gray-700"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>

        <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={loading}>
          {loading ? "Creating Account..." : "Register"}
        </Button>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="underline hover:text-teal-600 transition">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
