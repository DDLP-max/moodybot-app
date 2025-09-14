import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Body = z.object({
  userId: z.string().min(1),
  mode: z.enum(["dynamic", "validation", "creative", "copywriter"]).optional(),
});

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
    const json = await req.json();
    const { userId, mode } = Body.parse(json);

    const session = await createSession({ userId, mode: mode ?? "dynamic" });
    // session must include an id
    if (!session?.id) {
      return NextResponse.json(
        { error: "Session has no id" },
        { status: 500, headers: { "X-MB-Route": "chat/sessions" } }
      );
    }

    return NextResponse.json(
      { id: session.id },
      { status: 200, headers: { "X-MB-Route": "chat/sessions" } }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: err.flatten() },
        { status: 400, headers: { "X-MB-Route": "chat/sessions" } }
      );
    }
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
