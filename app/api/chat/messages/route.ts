import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "roomId обязателен" }, { status: 400 });
    }

    const pool = getPool();

    // Получаем сообщения с именами пользователей
    const result = await pool.query(
      `SELECT 
        cm.*,
        u.username
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.room_id = $1
       ORDER BY cm.created_at ASC
       LIMIT 100`,
      [parseInt(roomId)]
    );

    return NextResponse.json({ messages: result.rows }, { status: 200 });
  } catch (error: unknown) {
    console.error("Get messages error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка загрузки сообщений", details: errorMessage },
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
    const { roomId, content } = body;

    if (!roomId || !content?.trim()) {
      return NextResponse.json(
        { error: "roomId и content обязательны" },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Проверяем, что пользователь является участником комнаты
    const roomCheck = await pool.query(
      `SELECT id FROM chat_rooms WHERE id = $1`,
      [parseInt(roomId)]
    );

    if (roomCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Комната не найдена" },
        { status: 404 }
      );
    }

    // Добавляем пользователя в комнату если он еще не участник
    await pool.query(
      `INSERT INTO chat_room_users (room_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (room_id, user_id) DO NOTHING`,
      [parseInt(roomId), session.userId]
    );

    // Создаем сообщение
    const result = await pool.query(
      `INSERT INTO chat_messages (room_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, user_id, content, created_at`,
      [parseInt(roomId), session.userId, content.trim()]
    );

    return NextResponse.json(
      {
        message: "Сообщение отправлено",
        messageData: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Send message error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка отправки сообщения", details: errorMessage },
      { status: 500 }
    );
  }
}
