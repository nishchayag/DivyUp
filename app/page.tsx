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
    <div className="min-h-[80vh] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="mb-6">
          <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full mb-4">
            Split expenses effortlessly
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 max-w-3xl">
          Split bills with friends,{" "}
          <span className="text-blue-600 dark:text-blue-400">
            without the awkwardness
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl">
          DivyUp makes it easy to track shared expenses, settle debts, and keep
          everyone on the same page. No more spreadsheets or mental math.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 text-lg"
          >
            Start Splitting Free →
          </Link>
          <Link
            href="/auth/signin"
            className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-lg"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
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
      <section className="py-16 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
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
      <section className="py-16 border-t border-gray-200 dark:border-gray-800 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to stop the IOU chaos?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Join thousands of groups already using DivyUp.
        </p>
        <Link
          href="/auth/signup"
          className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg text-lg"
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
    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
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
    <div className="text-center p-6">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Groups
        </h2>
        <Link
          href="/groups/new"
          className="text-sm text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
