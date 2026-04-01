import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import Expense from "@/models/Expense";
import { enforceRateLimit } from "@/lib/rateLimit";
import { resolveTenantContext } from "@/lib/tenant";

type IdLike = { toString: () => string };

interface ExportMember {
  email?: string;
  name?: string;
}

interface ExportExpense {
  createdAt: Date | string;
  title: string;
  amount: number;
  paidBy?: ExportMember;
  splitBetween?: ExportMember[];
}

function toCsv(value: string | number) {
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "groups:export",
    max: 20,
    windowMs: 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const group = await Group.findById(params.id).populate(
    "members",
    "name email",
  );
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isMember = group.members.some(
    (m: { _id: IdLike }) => m._id.toString() === ctx.user._id.toString(),
  );
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expenses = await Expense.find({ group: params.id })
    .populate("paidBy", "name email")
    .populate("splitBetween", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const rows = [
    ["Date", "Title", "Amount", "Paid By", "Split Between"],
    ...expenses.map((expense) => {
      const rowExpense = expense as unknown as ExportExpense;
      return [
      new Date(rowExpense.createdAt).toISOString(),
      rowExpense.title,
      rowExpense.amount,
      rowExpense.paidBy?.email || rowExpense.paidBy?.name || "Unknown",
      (rowExpense.splitBetween || [])
        .map((m: ExportMember) => m.email || m.name || "Unknown")
        .join(" | "),
      ];
    }),
  ];

  const csv = rows
    .map((row) => row.map((cell) => toCsv(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="group-${params.id}-expenses.csv"`,
    },
  });
}
