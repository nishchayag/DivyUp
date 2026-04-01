import { NextRequest, NextResponse } from "next/server";
import { getFxRates } from "@/utils/currency";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const base = searchParams.get("base") || "USD";

  return NextResponse.json({
    base: base.toUpperCase(),
    rates: getFxRates(base),
    source: "static_fallback",
  });
}
