import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId?: string;
      role?: "owner" | "admin" | "member";
      plan?: "free" | "pro";
      isPlatformAdmin?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId?: string;
    role?: "owner" | "admin" | "member";
    plan?: "free" | "pro";
    isPlatformAdmin?: boolean;
  }
}
