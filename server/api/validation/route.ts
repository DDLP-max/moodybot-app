import { NextResponse } from "next/server";
import { ValidationSchema } from "../../../lib/validationSchema";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}

export async function POST(req: Request) {
  // ✅ Never double-consume req.json(): read raw once and parse ourselves
  const raw = await req.text();
  let body: unknown;
  try { 
    body = JSON.parse(raw); 
  } catch (e) { 
    return NextResponse.json({ 
      error: "Invalid JSON", 
      raw: raw.substring(0, 200) + "...",
      parse_error: e.message 
    }, { status: 400 }); 
  }

  const parsed = ValidationSchema.safeParse(body);
  if (!parsed.success) {
    // ⛳ Return **422** with the exact reasons so you can see it in the Network panel
    return NextResponse.json(
      { 
        error: "Validation failed", 
        zod_errors: parsed.error.flatten(), 
        received: body,
        schema_keys: Object.keys(ValidationSchema.shape)
      },
      { status: 422 }
    );
  }

  // … your existing logic …
  return NextResponse.json({ 
    ok: true, 
    data: parsed.data,
    message: "Schema validation passed - ready for processing"
  });
}
