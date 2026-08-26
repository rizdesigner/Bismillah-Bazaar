export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });

  for (const { name } of request.cookies.getAll()) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}
