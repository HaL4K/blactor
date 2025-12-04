import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    console.log("🔒 API Logout requested");
    return await logout();
  } catch (error: unknown) {
    console.error("❌ Logout error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return new Response(
      JSON.stringify({ error: "Ошибка при выходе", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
