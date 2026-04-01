"use client";

import { useEffect, useState } from "react";

interface TenantPayload {
  user: {
    name: string;
    email: string;
    image?: string;
    role: "owner" | "admin" | "member";
    isPlatformAdmin?: boolean;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  subscription: {
    plan: "free" | "pro";
    status: string;
    currentPeriodEnd?: string;
  };
}

export default function SettingsPage() {
  const [data, setData] = useState<TenantPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackEntries, setFeedbackEntries] = useState<
    Array<{
      _id: string;
      message: string;
      page?: string;
      createdAt: string;
      user?: { name?: string; email?: string };
    }>
  >([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/tenant");
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || "Failed to load workspace settings");
        }
        setData(payload);
        setProfileName(payload.user.name || "");
        setProfileImage(payload.user.image || "");
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load settings",
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!data?.user?.isPlatformAdmin && data?.user?.role !== "admin") return;

    const run = async () => {
      try {
        const res = await fetch("/api/feedback");
        const payload = await res.json();
        if (res.ok) {
          setFeedbackEntries(payload.feedback || []);
        }
      } catch {
        // Keep settings usable even if feedback listing fails.
      }
    };

    run();
  }, [data]);

  const saveProfile = async () => {
    setError("");
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          image: profileImage || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Failed to update profile");
      }
      setProfileName(payload.user.name || "");
      setProfileImage(payload.user.image || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitFeedback = async () => {
    if (feedbackMessage.trim().length < 5) {
      setError("Feedback must be at least 5 characters.");
      return;
    }

    setError("");
    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedbackMessage.trim(),
          page: "/settings",
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Failed to submit feedback");
      }
      setFeedbackMessage("");
      if (payload.feedback?._id) {
        setFeedbackEntries((prev) => [payload.feedback, ...prev]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const goToBillingFlow = async (
    endpoint: "/api/billing/checkout" | "/api/billing/portal",
  ) => {
    setError("");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Billing action failed");
      }
      window.location.href = payload.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Billing action failed");
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-slate-500">
        Loading workspace settings...
      </div>
    );
  }

  if (error && !data) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  if (!data) {
    return (
      <div className="text-red-600 dark:text-red-400">
        Unable to load workspace data.
      </div>
    );
  }

  const canManageBilling =
    data.user.role === "owner" || data.user.role === "admin";

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
        Workspace Settings
      </h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="surface-card rounded-2xl p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4 text-xl">
          Profile
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Display Name
            </label>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Profile Photo URL
            </label>
            <input
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
              placeholder="https://..."
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="brand-button disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4 text-xl">
          Organization
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-100/70 dark:bg-slate-800/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Workspace Name
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">
              {data.organization.name}
            </p>
          </div>
          <div className="rounded-xl bg-slate-100/70 dark:bg-slate-800/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Slug
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">
              {data.organization.slug}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4 text-xl">
          Subscription
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs rounded-full px-3 py-1 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
            Plan: {data.subscription.plan.toUpperCase()}
          </span>
          <span className="text-xs rounded-full px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Status: {data.subscription.status}
          </span>
        </div>
        {data.subscription.currentPeriodEnd && (
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Renews/ends on:{" "}
            {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => goToBillingFlow("/api/billing/checkout")}
            disabled={!canManageBilling}
            className="brand-button disabled:opacity-50 disabled:pointer-events-none"
          >
            Upgrade to Pro
          </button>
          <button
            onClick={() => goToBillingFlow("/api/billing/portal")}
            disabled={!canManageBilling}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100/70 dark:hover:bg-slate-700/70"
          >
            Open Billing Portal
          </button>
        </div>
        {!canManageBilling && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Only workspace admins can manage billing.
          </p>
        )}
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4 text-xl">
          Feedback
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Tell us what to improve. We review this and ship updates based on it.
        </p>
        <textarea
          value={feedbackMessage}
          onChange={(e) => setFeedbackMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
          placeholder="What should we improve next?"
        />
        <button
          onClick={submitFeedback}
          disabled={submittingFeedback}
          className="mt-3 brand-button disabled:opacity-50"
        >
          {submittingFeedback ? "Submitting..." : "Submit Feedback"}
        </button>

        {(data.user.role === "admin" || data.user.isPlatformAdmin) && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Recent Team Feedback
            </h3>
            {feedbackEntries.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No feedback yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {feedbackEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {entry.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {entry.user?.name || "User"} • {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
