import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { RegisterData } from "@/lib/types";
import { UserRow } from "@/lib/db";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const pool = getPool();
    const body: RegisterData = await request.json();

    console.log("📝 Registration attempt:", {
      email: body.email,
      username: body.username,
    });

    // Валидация
    if (!body.email || !body.username || !body.password) {
      return new Response(JSON.stringify({ error: "Все поля обязательны" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.password !== body.confirmPassword) {
      return new Response(JSON.stringify({ error: "Пароли не совпадают" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Пароль должен быть не менее 6 символов" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Проверка существования пользователя
    const existingUser = await pool.query<UserRow>(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [body.email, body.username]
    );

    if (existingUser.rows.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Пользователь с таким email или логином уже существует",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Создание пользователя
    const result = await pool.query<UserRow>(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username",
      [body.email, body.username, hashedPassword]
    );

    const user = result.rows[0];
    console.log("✅ User created:", user);

    // Создание профиля игрока
    await pool.query("INSERT INTO player_profiles (user_id) VALUES ($1)", [
      user.id,
    ]);

    // Создание сессии
    console.log("✅ Creating session for new user...");
    return await createSession(user.id, user.email, user.username);
  } catch (error: unknown) {
    console.error("❌ Registration error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return new Response(
      JSON.stringify({ error: "Ошибка сервера", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
