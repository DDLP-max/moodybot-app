import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/app/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const id = getOrCreateUserId();           // no body parsing
    return NextResponse.json({ id }, { headers: { "X-MB-Route": "users" } });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to get/create user" },
      { status: 500, headers: { "X-MB-Route": "users" } }
    );
  }
}

export async function GET() {                 // helpful for quick checks
  return POST();
}
