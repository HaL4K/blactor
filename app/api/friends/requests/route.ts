import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("📨 Получение запросов в друзья...");
    const session = await getSession();

    if (!session) {
      console.log("❌ Не авторизован для получения запросов");
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    console.log(`👤 Получение запросов для пользователя ID: ${session.userId}`);

    const pool = getPool();

    try {
      // Получаем входящие запросы в друзья (где текущий пользователь - получатель)
      const incomingResult = await pool.query(
        `SELECT 
          f.*,
          u.username as sender_username,
          u.email as sender_email
         FROM friends f
         JOIN users u ON f.user_id = u.id
         WHERE f.friend_id = $1 AND f.status = 'pending'`,
        [session.userId]
      );

      console.log(`📥 Входящих запросов: ${incomingResult.rows.length}`);

      // Получаем исходящие запросы в друзья (где текущий пользователь - отправитель)
      const outgoingResult = await pool.query(
        `SELECT 
          f.*,
          u.username as friend_username,
          u.email as friend_email
         FROM friends f
         JOIN users u ON f.friend_id = u.id
         WHERE f.user_id = $1 AND f.status = 'pending'`,
        [session.userId]
      );

      console.log(`📤 Исходящих запросов: ${outgoingResult.rows.length}`);

      return NextResponse.json(
        {
          incoming: incomingResult.rows,
          outgoing: outgoingResult.rows,
        },
        { status: 200 }
      );
    } catch (error: unknown) {
      console.error("❌ Ошибка запроса списка друзей:", error);

      // Возможно таблица friends не существует или другая ошибка
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return NextResponse.json(
        {
          error: "Ошибка загрузки запросов в друзья",
          details: errorMessage,
          incoming: [],
          outgoing: [],
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error("❌ Get friend requests error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      {
        error: "Ошибка загрузки запросов в друзья",
        details: errorMessage,
        incoming: [],
        outgoing: [],
      },
      { status: 500 }
    );
  }
}
