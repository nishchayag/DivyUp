"use client";

import { useState } from "react";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(error ? "Invalid credentials" : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setErrorMsg("Invalid email or password");
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = () => {
    signIn("github", { callbackUrl });
  };

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2 gap-6 items-stretch">
      <section className="hidden lg:flex surface-card rounded-3xl p-10 flex-col justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400 mb-3">
            Welcome Back
          </p>
          <h1 className="font-display text-4xl font-bold text-slate-900 dark:text-white leading-tight">
            Continue where your team left off.
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300 max-w-md">
            Check balances, settle faster, and keep every shared expense in one
            place.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <div className="rounded-2xl bg-sky-100/70 dark:bg-sky-900/30 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Monthly active users
            </p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              18k+
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-100/70 dark:bg-emerald-900/30 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Avg settle time
            </p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              32 sec
            </p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-md mx-auto surface-card rounded-3xl p-8 md:p-10 self-center">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Sign in to your DivyUp account
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full brand-button py-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
          <span className="px-4 text-sm text-slate-500 dark:text-slate-400">
            or
          </span>
          <div className="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
        </div>

        <button
          onClick={handleGitHubSignIn}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          Continue with GitHub
        </button>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            Sign up
          </Link>
        </p>
      </section>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading sign in...</div>}>
      <SignInForm />
    </Suspense>
  );
}
