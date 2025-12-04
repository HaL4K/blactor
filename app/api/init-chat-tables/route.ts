import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("🚀 Инициализация таблиц для чата...");

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Создаем таблицы для чата
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_private BOOLEAN DEFAULT FALSE,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_room_users (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(room_id, user_id)
        )
      `);

      // Создаем индексы
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_room_users_room_id ON chat_room_users(room_id);
      `);

      // Создаем начальные комнаты
      const userResult = await client.query("SELECT id FROM users LIMIT 1");
      const firstUserId = userResult.rows[0]?.id || 1;

      await client.query(
        `
        INSERT INTO chat_rooms (name, description, is_private, created_by) 
        VALUES 
          ('Общий чат', 'Основная комната для всех пользователей', FALSE, $1),
          ('Игровой зал', 'Обсуждение игр и стратегий', FALSE, $1),
          ('Только для своих', 'Приватная комната', TRUE, $1)
        ON CONFLICT DO NOTHING;
      `,
        [firstUserId]
      );

      return NextResponse.json(
        {
          success: true,
          message: "Таблицы для чата успешно созданы",
          tables: ["chat_rooms", "chat_messages", "chat_room_users"],
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("❌ Ошибка создания таблиц для чата:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      {
        success: false,
        error: "Ошибка создания таблиц для чата",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
