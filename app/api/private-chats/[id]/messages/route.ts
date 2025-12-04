import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  console.log("📨 Получение сообщений для чата, ID из params:", params.id);

  try {
    const session = await getSession();

    if (!session) {
      console.log("❌ Нет сессии - пользователь не авторизован");
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Преобразуем ID чата в число
    const chatId = parseInt(params.id);
    console.log("🔢 Chat ID после парсинга:", chatId);

    // Проверяем что chatId валидный
    if (isNaN(chatId) || chatId <= 0) {
      console.log("❌ Неверный ID чата:", params.id);
      return NextResponse.json(
        { error: "Неверный идентификатор чата", received_id: params.id },
        { status: 400 }
      );
    }

    console.log("👤 Пользователь ID:", session.userId);
    console.log("💬 Запрашивает сообщения для чата ID:", chatId);

    const pool = getPool();

    // ВРЕМЕННО: пропускаем проверку принадлежности чата
    console.log("⚠️ Временно пропускаем проверку принадлежности чата");

    try {
      // Проверяем существует ли таблица private_messages
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'private_messages'
        );
      `);

      const tableExists = tableCheck.rows[0].exists;
      console.log("📊 Таблица private_messages существует:", tableExists);

      if (!tableExists) {
        console.log("✅ Таблицы нет, возвращаем пустой массив");
        return NextResponse.json(
          {
            messages: [],
            chatId: chatId,
            note: "Таблица сообщений не существует, используйте временный чат",
          },
          { status: 200 }
        );
      }

      // Получаем сообщения
      const messagesResult = await pool.query(
        `SELECT 
    pm.*,
    u.username as sender_username
   FROM private_messages pm
   LEFT JOIN users u ON pm.sender_id = u.id
   WHERE pm.chat_id = $1
   ORDER BY pm.created_at ASC
   LIMIT 100`,
        [chatId]
      );
      console.log("✅ Найдено сообщений:", messagesResult.rows.length);

      return NextResponse.json(
        {
          messages: messagesResult.rows,
          chatId: chatId,
          count: messagesResult.rows.length,
        },
        { status: 200 }
      );
    } catch (dbError: any) {
      console.error("❌ Ошибка базы данных:", dbError);

      // Если ошибка связана с таблицей, возвращаем пустой массив
      if (
        dbError.message.includes("отношение") ||
        dbError.message.includes("таблица")
      ) {
        console.log("✅ Таблицы нет, возвращаем пустой массив");
        return NextResponse.json(
          {
            messages: [],
            chatId: chatId,
            note: "Таблица сообщений не найдена, используйте временный чат",
          },
          { status: 200 }
        );
      }

      throw dbError;
    }
  } catch (error: unknown) {
    console.error("❌ Ошибка загрузки сообщений:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      {
        error: "Ошибка загрузки сообщений",
        details: errorMessage,
        chatId: params.id,
      },
      { status: 500 }
    );
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    const chatId = parseInt(params.id);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Сообщение не может быть пустым" },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Вставка сообщения
    const messageResult = await pool.query(
      `INSERT INTO private_messages (chat_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, chat_id, sender_id, content, created_at`,
      [chatId, session.userId, content.trim()]
    );

    return NextResponse.json(
      {
        message: "Сообщение отправлено",
        messageData: messageResult.rows[0],
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Send private message error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json(
      { error: "Ошибка отправки сообщения", details: errorMessage },
      { status: 500 }
    );
  }
}
