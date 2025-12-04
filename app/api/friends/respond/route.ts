import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action } = body; // action: 'accept' или 'reject'

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "ID запроса и действие обязательны" },
        { status: 400 }
      );
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Действие должно быть 'accept' или 'reject'" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Проверяем, существует ли запрос и принадлежит ли текущему пользователю
      const requestCheck = await client.query(
        `SELECT * FROM friends 
         WHERE id = $1 AND friend_id = $2 AND status = 'pending'`,
        [requestId, session.userId]
      );

      if (requestCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "Запрос не найден или уже обработан" },
          { status: 404 }
        );
      }

      const friendRequest = requestCheck.rows[0];

      if (action === "accept") {
        // Обновляем статус на 'accepted'
        await client.query(
          `UPDATE friends SET status = 'accepted', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [requestId]
        );

        // Создаем уведомление для отправителя
        try {
          await client.query(
            `INSERT INTO notifications (user_id, type, message, related_id) 
             VALUES ($1, $2, $3, $4)`,
            [
              friendRequest.user_id,
              "friend_request_accepted",
              `${session.username} принял(а) ваш запрос в друзья`,
              friendRequest.id,
            ]
          );
        } catch (error) {
          console.log("Уведомление не отправлено:", error);
        }

        return NextResponse.json(
          { success: true, message: "Запрос в друзья принят" },
          { status: 200 }
        );
      } else {
        // Обновляем статус на 'rejected'
        await client.query(
          `UPDATE friends SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [requestId]
        );

        return NextResponse.json(
          { success: true, message: "Запрос в друзья отклонен" },
          { status: 200 }
        );
      }
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("Respond to friend request error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка обработки запроса в друзья", details: errorMessage },
      { status: 500 }
    );
  }
}
