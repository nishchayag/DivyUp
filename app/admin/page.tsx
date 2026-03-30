"use client";

import { useEffect, useState } from "react";

interface Metrics {
  users: number;
  organizations: number;
  groups: number;
  expenses: number;
  proSubscriptions: number;
  conversionRate: number;
}

interface AuditEvent {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [metricsRes, auditRes] = await Promise.all([
          fetch("/api/admin/metrics"),
          fetch("/api/audit?limit=20"),
        ]);

        const metricsPayload = await metricsRes.json();
        const auditPayload = await auditRes.json();

        if (!metricsRes.ok) {
          throw new Error(metricsPayload.error || "Failed to load admin metrics");
        }

        setMetrics(metricsPayload.metrics);
        setEvents(auditRes.ok ? auditPayload.events || [] : []);
      } catch (err: any) {
        setError(err.message || "Failed to load admin dashboard");
      }
    };

    load();
  }, []);

  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  if (!metrics) {
    return <div className="text-slate-500">Loading admin dashboard...</div>;
  }

  const statCards = [
    { label: "Users", value: metrics.users },
    { label: "Organizations", value: metrics.organizations },
    { label: "Groups", value: metrics.groups },
    { label: "Expenses", value: metrics.expenses },
    { label: "Pro subscriptions", value: metrics.proSubscriptions },
    { label: "Conversion rate", value: `${metrics.conversionRate}%` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
        Platform Admin
      </h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="surface-card rounded-2xl p-5"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="surface-card rounded-2xl p-5">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-3 text-xl">
          Recent Audit Events
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No events to display.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event._id}
                className="text-sm border-b border-slate-200/80 dark:border-slate-700/80 py-3 last:border-b-0"
              >
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 mr-2">
                  {event.entityType}
                </span>
                <span className="font-medium text-slate-900 dark:text-white">{event.action}</span>
                <span className="text-slate-500 dark:text-slate-400"> · {new Date(event.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
