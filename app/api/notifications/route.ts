import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("🔔 Получение уведомлений...");
    const session = await getSession();

    if (!session) {
      console.log("❌ Не авторизован для получения уведомлений");
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    console.log(
      `👤 Получение уведомлений для пользователя ID: ${session.userId}`
    );

    const pool = getPool();

    try {
      // Получаем уведомления пользователя
      const result = await pool.query(
        `SELECT 
          n.*,
          u.username as sender_username
         FROM notifications n
         LEFT JOIN users u ON n.related_id = u.id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC
         LIMIT 50`,
        [session.userId]
      );

      console.log(`✅ Найдено уведомлений: ${result.rows.length}`);

      return NextResponse.json(
        {
          notifications: result.rows,
        },
        { status: 200 }
      );
    } catch (error: unknown) {
      console.error("❌ Ошибка запроса уведомлений:", error);

      // Возможно таблица notifications не существует
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return NextResponse.json(
        {
          error: "Ошибка загрузки уведомлений",
          details: errorMessage,
          notifications: [], // Возвращаем пустой массив
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error("❌ Общая ошибка получения уведомлений:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      {
        error: "Ошибка загрузки уведомлений",
        details: errorMessage,
        notifications: [],
      },
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
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID уведомления обязателен" },
        { status: 400 }
      );
    }

    const pool = getPool();

    try {
      // Помечаем уведомление как прочитанное
      await pool.query(
        "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
        [notificationId, session.userId]
      );

      return NextResponse.json(
        { success: true, message: "Уведомление помечено как прочитанное" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Ошибка обновления уведомления:", error);
      return NextResponse.json(
        { success: true, message: "Не удалось обновить уведомление" },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error("Mark notification as read error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка обновления уведомления", details: errorMessage },
      { status: 500 }
    );
  }
}
