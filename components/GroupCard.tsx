import Link from "next/link";
import { AvatarGroup } from "./Avatar";

interface GroupCardProps {
  group: {
    _id: string;
    name: string;
    description?: string;
    members?: { _id: string; name: string; image?: string }[];
  };
}

export default function GroupCard({ group }: GroupCardProps) {
  const memberCount = group.members?.length || 1;

  return (
    <Link
      href={`/groups/${group._id}`}
      className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-gray-900 dark:text-white">
        {group.name}
      </h3>
      {group.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {group.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between">
        {group.members && group.members.length > 0 ? (
          <AvatarGroup
            users={group.members.map((m) => ({
              name: m.name,
              image: m.image,
            }))}
            max={4}
            size="sm"
          />
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </div>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500">→</span>
      </div>
    </Link>
  );
}
