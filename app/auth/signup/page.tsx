"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Create user via API
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Auto sign in after successful registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/");
        router.refresh();
      } else {
        // Registration successful but sign-in failed, redirect to sign-in
        router.push("/auth/signin");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2 gap-6 items-stretch">
      <section className="hidden lg:flex surface-card rounded-3xl p-10 flex-col justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400 mb-3">
            Get Started
          </p>
          <h1 className="font-display text-4xl font-bold text-slate-900 dark:text-white leading-tight">
            Build a shared money rhythm with your people.
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300 max-w-md">
            Create your workspace, invite your team, and track every split from
            day one.
          </p>
        </div>

        <div className="rounded-2xl bg-white/65 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Free plan includes:
          </p>
          <ul className="mt-3 text-sm text-slate-700 dark:text-slate-200 space-y-2">
            <li>• Up to 3 groups</li>
            <li>• Up to 8 members</li>
            <li>• 200 expenses per month</li>
          </ul>
        </div>
      </section>

      <section className="w-full max-w-md mx-auto surface-card rounded-3xl p-8 md:p-10 self-center">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Create an account
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Start splitting expenses with your team
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-slate-500">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full brand-button py-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
