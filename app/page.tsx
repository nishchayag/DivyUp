"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import GroupCard from "@/components/GroupCard";
import { DashboardSkeleton } from "@/components/Skeleton";
import { NoGroupsEmpty } from "@/components/EmptyState";

interface Group {
  _id: string;
  name: string;
  description?: string;
  members: { _id: string; name: string }[];
}

// Landing page for unauthenticated users
function LandingPage() {
  return (
    <div className="min-h-[80vh] flex flex-col gap-8">
      {/* Hero Section */}
      <section className="surface-card rounded-3xl flex-1 flex flex-col items-center justify-center text-center py-16 px-4 md:px-8">
        <div className="mb-7">
          <span className="inline-block px-4 py-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-sm font-medium rounded-full mb-4">
            Split expenses effortlessly
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 max-w-4xl tracking-tight">
          Split bills with friends,{" "}
          <span className="text-sky-600 dark:text-sky-400">
            without the awkwardness
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl">
          DivyUp makes it easy to track shared expenses, settle debts, and keep
          everyone on the same page. No more spreadsheets or mental math.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/signup"
            className="brand-button px-8 py-4 text-lg"
          >
            Start Splitting Free →
          </Link>
          <Link
            href="/auth/signin"
            className="px-8 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors text-lg"
          >
            Sign In
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-lg"
          >
            View Pricing
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
          <MetricChip label="Active Workspaces" value="4.7k" />
          <MetricChip label="Expenses Tracked" value="1.2M" />
          <MetricChip label="Avg Settle Time" value="32s" />
          <MetricChip label="Uptime" value="99.9%" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 border-t border-slate-200/80 dark:border-slate-700/80">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
          Everything you need to split expenses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="👥"
            title="Create Groups"
            description="Organize expenses by trip, household, or any shared activity. Invite friends via email."
          />
          <FeatureCard
            icon="💰"
            title="Track Expenses"
            description="Add expenses on the go. We automatically split costs equally among group members."
          />
          <FeatureCard
            icon="⚖️"
            title="Settle Up"
            description="See who owes what at a glance. Our smart algorithm minimizes the number of payments needed."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 border-t border-slate-200/80 dark:border-slate-700/80">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StepCard
            number={1}
            title="Sign Up"
            description="Create your free account in seconds"
          />
          <StepCard
            number={2}
            title="Create a Group"
            description="Add friends by email"
          />
          <StepCard
            number={3}
            title="Add Expenses"
            description="Log who paid for what"
          />
          <StepCard
            number={4}
            title="Settle Up"
            description="See simplified debts & pay up"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="surface-card rounded-3xl py-16 border-t border-slate-200/80 dark:border-slate-700/80 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Ready to stop the IOU chaos?
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Join thousands of groups already using DivyUp.
        </p>
        <Link
          href="/auth/signup"
          className="brand-button px-8 py-4 text-lg"
        >
          Get Started — It&apos;s Free
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="surface-card p-6 rounded-2xl hover:-translate-y-1 transition-transform">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 surface-card rounded-2xl">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-xl px-4 py-3 text-left">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchGroups();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton only for authenticated users
  if (status === "loading") {
    return <DashboardSkeleton />;
  }

  // Landing page for visitors
  if (status === "unauthenticated") {
    return <LandingPage />;
  }

  // Loading state for fetching groups
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchGroups}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Dashboard for authenticated users
  return (
    <div>
      <div className="flex items-center justify-between mb-6 surface-card rounded-2xl px-5 py-4">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Your Groups
        </h2>
        <Link
          href="/groups/new"
          className="brand-button text-sm px-4 py-2 rounded-lg"
        >
          + New Group
        </Link>
      </div>

      {groups.length === 0 ? (
        <NoGroupsEmpty />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <GroupCard key={group._id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
