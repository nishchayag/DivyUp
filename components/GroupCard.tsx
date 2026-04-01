import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/utils/currency";

interface GroupCardProps {
  group: {
    _id: string;
    name: string;
    description?: string;
    currency?: string;
    netBalance?: number;
    members?: { _id: string; name: string; image?: string }[];
  };
}

export default function GroupCard({ group }: GroupCardProps) {
  const currency = group.currency || "USD";
  const netBalance = group.netBalance || 0;
  const balanceLabel =
    Math.abs(netBalance) < 0.01
      ? "Settled"
      : netBalance > 0
        ? `You are owed ${formatCurrency(netBalance, currency)}`
        : `You owe ${formatCurrency(Math.abs(netBalance), currency)}`;

  return (
    <Link
      href={`/groups/${group._id}`}
      className="group block p-5 surface-card rounded-2xl shadow-sm hover:shadow-xl hover:shadow-sky-600/10 transition-all hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">
          {group.name}
        </h3>
        <span className="text-xs rounded-full px-2 py-1 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Active
        </span>
      </div>
      {group.description && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
          {group.description}
        </p>
      )}
      <div className="mt-5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>
          {group.members?.length || 1} member
          {(group.members?.length || 1) !== 1 ? "s" : ""}
        </span>
        <span className="text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
          Open
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={`text-xs font-medium ${
            netBalance > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : netBalance < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {balanceLabel}
        </span>
        <div className="flex -space-x-2">
          {(group.members || []).slice(0, 5).map((member) =>
            member.image ? (
              <Image
                key={member._id}
                src={member.image}
                alt={member.name}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-900"
                unoptimized
              />
            ) : (
              <div
                key={member._id}
                className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-br from-sky-500 to-blue-700 text-white text-[10px] flex items-center justify-center"
                title={member.name}
              >
                {member.name?.[0]?.toUpperCase() || "U"}
              </div>
            ),
          )}
        </div>
      </div>
    </Link>
  );
}
