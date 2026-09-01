import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const name = request.nextUrl.searchParams.get("name") ?? "";
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  try {
    await consumeMagicLink(token, name);
    return NextResponse.redirect(new URL("/recipes", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?expired=1", request.url));
  }
}
