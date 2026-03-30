import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { signUpSchema } from "@/lib/validations";
import { ensureOrganizationForUser } from "@/lib/tenant";

/**
 * POST /api/auth/signup
 * Create a new user account.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = signUpSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const errorValues = Object.values(errors) as string[][];
      const firstError = errorValues[0]?.[0] || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = result.data;

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const organization = await ensureOrganizationForUser(user);

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
        organization: {
          id: organization._id.toString(),
          name: organization.name,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
