import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("🟡 ТЕСТОВЫЙ API ДЛЯ СОЗДАНИЯ ЧАТА");

  try {
    // 1. Получаем данные разными способами
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      console.log("Не JSON, пробуем FormData");
      const formData = await req.formData();
      body = Object.fromEntries(formData);
    }

    const textBody = await req.text().catch(() => "");

    console.log("📊 Информация о запросе:");
    console.log("- Метод:", req.method);
    console.log("- URL:", req.url);
    console.log("- Query параметры:", searchParams);
    console.log("- Тело запроса (JSON):", body);
    console.log("- Тело запроса (текст):", textBody);

    // 2. Пробуем получить friend_id разными способами
    let friendId: number | null = null;

    // Из query параметров
    if (searchParams.friend_id) {
      friendId = parseInt(searchParams.friend_id);
      console.log("✅ Получен friend_id из query:", friendId);
    }
    // Из JSON тела
    else if (body.friend_id) {
      friendId = parseInt(body.friend_id);
      console.log("✅ Получен friend_id из JSON:", friendId);
    }
    // Из FormData
    else if (body.friend_id) {
      friendId = parseInt(body.friend_id);
      console.log("✅ Получен friend_id из FormData:", friendId);
    }

    if (!friendId) {
      console.log("❌ friend_id не найден ни в одном источнике");

      return Response.json(
        {
          success: false,
          error: "Friend ID not found in request",
          requestInfo: {
            method: req.method,
            url: req.url,
            searchParams: searchParams,
            jsonBody: body,
            textBody: textBody,
            headers: Object.fromEntries(req.headers.entries()),
          },
        },
        { status: 400 }
      );
    }

    console.log("✅ Friend ID найден:", friendId);

    // 3. Создаем фиктивный чат
    const chatId = Date.now();

    return Response.json(
      {
        success: true,
        chatId: chatId,
        friendId: friendId,
        message: "Тестовый чат создан успешно",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("🔥 Ошибка:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
