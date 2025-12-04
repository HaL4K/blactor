import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    return NextResponse.json(
      {
        user: session
          ? {
              id: session.userId,
              email: session.email,
              username: session.username,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Auth check error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
