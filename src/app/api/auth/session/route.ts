import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { id_token } = await request.json();

  if (!id_token) {
    return NextResponse.json({ error: "id_token is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("id_token", id_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("id_token");
  return NextResponse.json({ success: true });
}
