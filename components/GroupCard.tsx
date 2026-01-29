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
      className="block p-4 bg-white rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-gray-900">{group.name}</h3>
      {group.description && (
        <p className="text-sm text-slate-500 mt-1">{group.description}</p>
      )}
      <div className="mt-3 text-xs text-slate-600">
        {group.members?.length || 1} member
        {(group.members?.length || 1) !== 1 ? "s" : ""}
      </div>
    </Link>
  );
}
