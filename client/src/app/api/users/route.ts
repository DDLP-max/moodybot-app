import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Simple in-memory user store for demo purposes
// In production, this would connect to your database
const users = new Map<string, { id: string; createdAt: Date }>();

async function getOrCreateUser(): Promise<{ id: string }> {
  // For demo purposes, create a simple user ID based on timestamp
  // In production, this would use cookies, headers, or database lookup
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store the user (in production, this would be in database)
  users.set(userId, { id: userId, createdAt: new Date() });
  
  return { id: userId };
}

export async function POST(req: Request) {
  try {
    // derive a stable fingerprint (cookies, headers, etc.) or create a new user
    const user = await getOrCreateUser(); // must return { id: string }

    if (!user?.id) {
      return NextResponse.json(
        { error: "User has no id" },
        { status: 500, headers: { "X-MB-Route": "users" } }
      );
    }

    return NextResponse.json(
      { id: user.id },
      { status: 200, headers: { "X-MB-Route": "users" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create/get user" },
      { status: 500, headers: { "X-MB-Route": "users" } }
    );
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { "X-MB-Route": "users" } }
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
    { status: 405, headers: { "X-MB-Route": "users" } }
  );
}
