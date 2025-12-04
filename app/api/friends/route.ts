import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("👥 Получение списка друзей...");
    const session = await getSession();

    if (!session) {
      console.log("❌ Не авторизован для получения друзей");
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    console.log(`👤 Получение друзей для пользователя ID: ${session.userId}`);

    const pool = getPool();

    try {
      // Получаем список друзей (взаимных, статус 'accepted')
      const result = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.email
         FROM friends f
         JOIN users u ON (
           (f.user_id = $1 AND f.friend_id = u.id) OR 
           (f.friend_id = $1 AND f.user_id = u.id)
         )
         WHERE f.status = 'accepted'`,
        [session.userId]
      );

      console.log(`✅ Найдено друзей: ${result.rows.length}`);

      return NextResponse.json(
        {
          friends: result.rows,
        },
        { status: 200 }
      );
    } catch (error: unknown) {
      console.error("❌ Ошибка запроса друзей:", error);

      // Возможно таблица friends не существует
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return NextResponse.json(
        {
          error: "Ошибка загрузки друзей",
          details: errorMessage,
          friends: [], // Возвращаем пустой массив
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error("❌ Общая ошибка получения друзей:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      {
        error: "Ошибка загрузки друзей",
        details: errorMessage,
        friends: [],
      },
      { status: 500 }
    );
  }
}

// Добавим POST для создания друзей напрямую (если нужно)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Используйте /api/friends/request для отправки запроса в друзья" },
    { status: 405 }
  );
}
