import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple in-memory session store for demo purposes
// In production, this would connect to your database
const sessions = new Map<string, { id: string; userId: string; mode: string; createdAt: Date }>();

async function createSession({ userId, mode }: { userId: string; mode: string }): Promise<{ id: string }> {
  // For demo purposes, create a simple session ID
  // In production, this would be stored in database
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store the session (in production, this would be in database)
  sessions.set(sessionId, { 
    id: sessionId, 
    userId, 
    mode, 
    createdAt: new Date() 
  });
  
  return { id: sessionId };
}

export async function POST(req: Request) {
  try {
    const jar = cookies();
    const cookieId = jar.get("mb_uid")?.value;
    let { userId, mode = "dynamic" } = await req.json().catch(() => ({}));
    userId = userId || cookieId;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400, headers: { "X-MB-Route": "chat/sessions" } }
      );
    }

    const session = await createSession({ userId, mode });
    if (!session?.id) throw new Error("no session id");

    return NextResponse.json(
      { id: session.id },
      { headers: { "X-MB-Route": "chat/sessions" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500, headers: { "X-MB-Route": "chat/sessions" } }
    );
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { "X-MB-Route": "chat/sessions" } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { "X-MB-Route": "users" } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { "X-MB-Route": "chat/sessions" } }
  );
}
