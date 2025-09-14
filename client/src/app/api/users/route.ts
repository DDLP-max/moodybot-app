import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/app/lib/user";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const id = getOrCreateUserId();        // no body required
    // optional: upsert into DB here
    return NextResponse.json({ id }, { headers: { "X-MB-Route": "users" } });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to get/create user" },
      { status: 500, headers: { "X-MB-Route": "users" } }
    );
  }
}

export async function GET() {              // nice to have
  return POST();
}
