import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "Session API test endpoint",
    timestamp: new Date().toISOString(),
    route: "test-session"
  }, {
    status: 200,
    headers: { 
      "X-MB-Route": "test-session",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export async function POST() {
  return NextResponse.json({
    message: "POST not allowed on test endpoint",
    route: "test-session"
  }, {
    status: 405,
    headers: { 
      "X-MB-Route": "test-session",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
