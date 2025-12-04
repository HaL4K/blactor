import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

    const pool = getPool();

    // Отмечаем все непрочитанные сообщения как прочитанные
    await pool.query(
      `UPDATE private_messages 
       SET is_read = TRUE
       WHERE chat_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [chatId, session.userId]
    );

    return NextResponse.json(
      { success: true, message: "Сообщения отмечены как прочитанные" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Mark as read error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка отметки сообщений", details: errorMessage },
      { status: 500 }
    );
  }
}
