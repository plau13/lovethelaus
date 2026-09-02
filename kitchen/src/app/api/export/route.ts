import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildUserExportPayload, recipesForExport } from "@/lib/export-eligibility";
import { toCsv } from "@/lib/export";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const payload = await buildUserExportPayload(user.id);

  if (format === "csv") {
    const csv = toCsv(payload);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kitchen-recipes.csv"',
      },
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": 'attachment; filename="kitchen-recipes.json"',
    },
  });
}

export async function HEAD(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse(null, { status: 401 });
  }
  const recipes = await recipesForExport(user.id);
  return NextResponse.json({ count: recipes.length });
}
