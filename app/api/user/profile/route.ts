import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { updateProfileSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return NextResponse.json({ error: firstError || "Invalid input" }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email.toLowerCase() });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (parsed.data.name !== undefined) {
    user.name = parsed.data.name;
  }
  if (parsed.data.image !== undefined) {
    user.image = parsed.data.image;
  }

  await user.save();

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
    },
  });
}
