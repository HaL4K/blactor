import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    const friendId = parseInt(params.id);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Находим запрос на дружбу
      const requestResult = await client.query(
        `SELECT * FROM friends 
         WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
        [friendId, session.userId]
      );

      if (requestResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Запрос на дружбу не найден" },
          { status: 404 }
        );
      }

      // Обновляем статус запроса
      await client.query(
        `UPDATE friends SET status = 'accepted', updated_at = NOW()
         WHERE user_id = $1 AND friend_id = $2`,
        [friendId, session.userId]
      );

      // Создаем обратную запись о дружбе
      await client.query(
        `INSERT INTO friends (user_id, friend_id, status)
         VALUES ($1, $2, 'accepted')
         ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted', updated_at = NOW()`,
        [session.userId, friendId]
      );

      // Создаем приватный чат, если его нет
      const user1Id = Math.min(session.userId, friendId);
      const user2Id = Math.max(session.userId, friendId);

      await client.query(
        `INSERT INTO private_chats (user1_id, user2_id)
         VALUES ($1, $2)
         ON CONFLICT (user1_id, user2_id) DO NOTHING`,
        [user1Id, user2Id]
      );

      // Создаем уведомление для отправителя запроса
      await client.query(
        `INSERT INTO notifications (user_id, type, message, related_id)
         VALUES ($1, 'friend_request', $2, $3)`,
        [
          friendId,
          `Пользователь ${session.username} принял ваш запрос на дружбу`,
          session.userId,
        ]
      );

      return NextResponse.json(
        {
          success: true,
          message: "Запрос на дружбу принят",
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("Accept friend error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка принятия запроса на дружбу", details: errorMessage },
      { status: 500 }
    );
  }
}
