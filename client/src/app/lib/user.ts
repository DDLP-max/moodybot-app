import { cookies } from "next/headers";

export function getOrCreateUserId() {
  const jar = cookies();
  let id = jar.get("mb_uid")?.value;
  if (!id) {
    id = crypto.randomUUID();
    jar.set("mb_uid", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1y
    });
  }
  return id;
}
