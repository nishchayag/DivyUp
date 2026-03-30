import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Membership from "@/models/Membership";
import Subscription from "@/models/Subscription";
import { ensureOrganizationForUser } from "@/lib/tenant";

// Build providers array dynamically
const providers: any[] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) {
        return null;
      }

      await dbConnect();
      const user = await User.findOne({ email: credentials.email }).lean();

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await bcrypt.compare(
        credentials.password,
        user.passwordHash,
      );

      if (!isValid) {
        return null;
      }

      // Return user object for the JWT
      return {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

// Only add GitHub provider if credentials are configured
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async jwt({ token, user }) {
      await dbConnect();

      if (user?.email) {
        const foundUser =
          (await User.findOne({ email: user.email.toLowerCase() })) ||
          (await User.create({
            name: user.name || "User",
            email: user.email.toLowerCase(),
            image: user.image,
          }));

        const org = await ensureOrganizationForUser(foundUser);
        const membership = await Membership.findOne({
          user: foundUser._id,
          organization: org._id,
        });
        const subscription = await Subscription.findOne({
          organization: org._id,
        });

        token.id = foundUser._id.toString();
        token.organizationId = org._id.toString();
        token.role = (membership?.role || "member") as any;
        token.plan = (subscription?.plan || "free") as any;
        token.isPlatformAdmin = !!foundUser.isPlatformAdmin;
        token.name = foundUser.name;
        token.email = foundUser.email;
        token.picture = foundUser.image;
      } else if (token?.email) {
        const foundUser = await User.findOne({
          email: token.email.toLowerCase(),
        });
        if (foundUser) {
          const org = await ensureOrganizationForUser(foundUser);
          const membership = await Membership.findOne({
            user: foundUser._id,
            organization: org._id,
          });
          const subscription = await Subscription.findOne({
            organization: org._id,
          });

          token.id = foundUser._id.toString();
          token.organizationId = org._id.toString();
          token.role = (membership?.role || "member") as any;
          token.plan = (subscription?.plan || "free") as any;
          token.isPlatformAdmin = !!foundUser.isPlatformAdmin;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).isPlatformAdmin = token.isPlatformAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
