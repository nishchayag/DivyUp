"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeProvider";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/65 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-900 dark:text-slate-100"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white text-sm font-bold shadow-lg shadow-sky-600/30">
            DU
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            DivyUp
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="hidden sm:inline text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Pricing
          </Link>
          {session?.user && (
            <Link
              href="/notifications"
              className="hidden sm:inline text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Notifications
            </Link>
          )}

          <ThemeToggle />

          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ) : session?.user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 pr-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-lg"
                    width={32}
                    height={32}
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:inline max-w-28 truncate">
                  {session.user.name}
                </span>
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 surface-card rounded-xl shadow-xl py-1 z-20">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <Link
                      href="/"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/groups/new"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      New Group
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Settings & Billing
                    </Link>
                    {session.user.isPlatformAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <hr className="my-1 border-slate-200 dark:border-slate-700" />
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        signOut({ callbackUrl: "/auth/signin" });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="brand-button text-sm px-4 py-2 rounded-lg"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
