// app/api/users/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrCreateUserId() {
  const jar = cookies();
  let id = jar.get("mb_uid")?.value;
  if (!id) {
    id = crypto.randomUUID();
    jar.set("mb_uid", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return id;
}

async function handler() {
  try {
    const id = getOrCreateUserId();
    return NextResponse.json(
      { id },
      { status: 200, headers: { "X-MB-Route": "users" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "users failed" },
      { status: 500, headers: { "X-MB-Route": "users" } }
    );
  }
}

export async function POST() { return handler(); }
export async function GET()  { return handler(); }