import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";

function nextDate(from: Date, frequency: "weekly" | "monthly") {
  const next = new Date(from);
  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function POST(req: NextRequest) {
  if (
    process.env.RECURRING_JOB_SECRET &&
    req.headers.get("x-job-secret") !== process.env.RECURRING_JOB_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const now = new Date();
  const dueExpenses = await Expense.find({
    "recurrence.enabled": true,
    "recurrence.nextRunAt": { $lte: now },
  });

  let created = 0;

  for (const expense of dueExpenses) {
    const frequency = expense.recurrence?.frequency || "monthly";

    await Expense.create({
      title: expense.title,
      amount: expense.amount,
      currency: expense.currency || "USD",
      category: expense.category,
      notes: expense.notes,
      paidBy: expense.paidBy,
      splitBetween: expense.splitBetween,
      splitMode: expense.splitMode,
      splitShares: expense.splitShares,
      group: expense.group,
      status: "open",
      comments: [],
      payments: [],
      recurrence: {
        enabled: true,
        frequency,
        nextRunAt: nextDate(now, frequency),
      },
    });

    expense.recurrence = {
      enabled: true,
      frequency,
      nextRunAt: nextDate(now, frequency),
    };
    await expense.save();
    created += 1;
  }

  return NextResponse.json({ created, scanned: dueExpenses.length });
}
