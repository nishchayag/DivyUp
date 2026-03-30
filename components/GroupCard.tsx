import Link from "next/link";

interface GroupCardProps {
  group: {
    _id: string;
    name: string;
    description?: string;
    members?: { _id: string; name: string }[];
  };
}

export default function GroupCard({ group }: GroupCardProps) {
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
    </Link>
  );
}
