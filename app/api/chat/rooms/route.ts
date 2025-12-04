import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const pool = getPool();

    // Простой запрос без сложных JOIN
    const result = await pool.query(
      `SELECT 
        cr.*,
        u.username as creator_username
       FROM chat_rooms cr
       LEFT JOIN users u ON cr.created_by = u.id
       WHERE cr.is_private = FALSE
       ORDER BY cr.created_at DESC`
    );

    return NextResponse.json({ rooms: result.rows }, { status: 200 });
  } catch (error: unknown) {
    console.error("Get rooms error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка загрузки комнат", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, is_private = false } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Название комнаты обязательно" },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Создаем комнату
    const result = await pool.query(
      `INSERT INTO chat_rooms (name, description, is_private, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, is_private, created_by, created_at`,
      [name.trim(), description?.trim() || null, is_private, session.userId]
    );

    const room = result.rows[0];

    // Добавляем создателя в комнату
    await pool.query(
      `INSERT INTO chat_room_users (room_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (room_id, user_id) DO NOTHING`,
      [room.id, session.userId]
    );

    return NextResponse.json(
      {
        message: "Комната создана",
        room,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create room error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка создания комнаты", details: errorMessage },
      { status: 500 }
    );
  }
}
