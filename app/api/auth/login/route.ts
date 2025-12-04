import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { LoginData } from "@/lib/types";
import { UserRow } from "@/lib/db";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const pool = getPool();
    const body: LoginData = await request.json();

    console.log("🔑 Login attempt for email:", body.email);

    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({ error: "Email и пароль обязательны" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Поиск пользователя
    const result = await pool.query<UserRow>(
      "SELECT * FROM users WHERE email = $1",
      [body.email]
    );

    if (result.rows.length === 0) {
      console.log("❌ User not found:", body.email);
      return new Response(
        JSON.stringify({ error: "Неверный email или пароль" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = result.rows[0];
    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(body.password, user.password);

    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", body.email);
      return new Response(
        JSON.stringify({ error: "Неверный email или пароль" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Создание сессии
    console.log("✅ Password valid, creating session...");
    return await createSession(user.id, user.email, user.username);
  } catch (error: unknown) {
    console.error("❌ Login error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return new Response(
      JSON.stringify({ error: "Ошибка сервера", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
