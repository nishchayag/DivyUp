import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * Get the current session on the server side.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user's ID from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return (session?.user as any)?.id || null;
}

/**
 * Check if the current user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}
