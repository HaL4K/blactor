import { Pool } from "pg";

// Типы для таблиц
export interface UserRow {
  id: number;
  email: string;
  username: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatRoomRow {
  id: number;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: number;
  created_at: Date;
}

export interface ChatMessageRow {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  created_at: Date;
}

export interface ChatRoomUserRow {
  id: number;
  room_id: number;
  user_id: number;
  joined_at: Date;
}

// Конфигурация пула
const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "gamer_messenger",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

let pool: Pool | null = null;

// Функция для получения пула
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);

    pool.on("connect", () => {
      console.log("✅ Подключение к базе данных установлено");
    });

    pool.on("error", (err) => {
      console.error("❌ Ошибка подключения к базе данных:", err.message);
    });
  }

  return pool;
}

export const query = (text: string, params?: any[]) => pool.query(text, params);

// Функция для создания всех таблиц
export async function initDB(): Promise<void> {
  console.log("🚀 Инициализация всех таблиц базы данных...");

  const client = await getPool().connect();
  try {
    // Проверяем, существует ли таблица users
    const check = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    const usersTableExists = check.rows[0].exists;

    if (!usersTableExists) {
      console.log("📦 Создание таблиц...");

      // Таблица пользователей
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Таблица users создана");
      await client.query(`
  CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
  )
`);
      console.log("✅ Таблица friends создана");
      // Таблица профилей игроков
      await client.query(`
        CREATE TABLE player_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          game_tags TEXT[] DEFAULT '{}',
          favorite_games TEXT[] DEFAULT '{}',
          avatar_url VARCHAR(500),
          bio TEXT,
          level INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Таблица player_profiles создана");

      // Таблица сессий
      await client.query(`
        CREATE TABLE user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Таблица user_sessions создана");

      // Таблица комнат чата
      await client.query(`
        CREATE TABLE chat_rooms (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_private BOOLEAN DEFAULT FALSE,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Таблица chat_rooms создана");

      // Таблица сообщений
      await client.query(`
        CREATE TABLE chat_messages (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Таблица chat_messages создана");

      // Таблица участников комнат
      await client.query(`
        CREATE TABLE chat_room_users (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(room_id, user_id)
        )
      `);
      console.log("✅ Таблица chat_room_users создана");

      // Создаем индекс для быстрого поиска сообщений по комнате
      await client.query(`
        CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
      `);
      console.log("✅ Индекс idx_chat_messages_room_id создан");

      // Создаем индекс для быстрого поиска сообщений по пользователю
      await client.query(`
        CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
      `);
      console.log("✅ Индекс idx_chat_messages_user_id создан");

      // Создаем индекс для быстрого поиска участников комнаты
      await client.query(`
        CREATE INDEX idx_chat_room_users_room_id ON chat_room_users(room_id);
      `);
      console.log("✅ Индекс idx_chat_room_users_room_id создан");

      // Создаем начальные комнаты чата
      await client.query(`
        INSERT INTO chat_rooms (name, description, is_private, created_by) 
        VALUES 
          ('Общий чат', 'Основная комната для всех пользователей', FALSE, 1),
          ('Игровой зал', 'Обсуждение игр и стратегий', FALSE, 1),
          ('Только для своих', 'Приватная комната', TRUE, 1)
        ON CONFLICT DO NOTHING;
      `);
      console.log("✅ Начальные комнаты чата созданы");
    } else {
      console.log("✅ Основные таблицы уже существуют");

      // Проверяем и создаем таблицы для чата если их нет
      await createChatTablesIfNotExist(client);
    }
  } catch (error) {
    console.error("❌ Ошибка инициализации БД:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Создаем таблицы для чата если их нет
async function createChatTablesIfNotExist(client: any): Promise<void> {
  try {
    // Проверяем существование таблицы chat_rooms
    const checkRooms = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_rooms'
      )
    `);

    if (!checkRooms.rows[0].exists) {
      console.log("📦 Создание таблиц для чата...");

      // Таблица комнат чата
      await client.query(`
        CREATE TABLE chat_rooms (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_private BOOLEAN DEFAULT FALSE,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Таблица chat_rooms создана");

      // Таблица сообщений
      await client.query(`
        CREATE TABLE chat_messages (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Таблица chat_messages создана");
      await client.query(`
  CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
  )
`);

      // Таблица приватных чатов (личные сообщения)
      await client.query(`
  CREATE TABLE IF NOT EXISTS private_chats (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id)
  )
`);

      // Таблица приватных сообщений
      await client.query(`
  CREATE TABLE IF NOT EXISTS private_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES private_chats(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

      // Таблица уведомлений
      await client.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    related_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

      // Создаем индексы для производительности
      await client.query(`
  CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
  CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
  CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
  CREATE INDEX IF NOT EXISTS idx_private_chats_user1_id ON private_chats(user1_id);
  CREATE INDEX IF NOT EXISTS idx_private_chats_user2_id ON private_chats(user2_id);
  CREATE INDEX IF NOT EXISTS idx_private_chats_last_message_at ON private_chats(last_message_at);
  CREATE INDEX IF NOT EXISTS idx_private_messages_chat_id ON private_messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_private_messages_receiver_id ON private_messages(receiver_id);
  CREATE INDEX IF NOT EXISTS idx_private_messages_is_read ON private_messages(is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
`);

      // Таблица участников комнат
      await client.query(`
        CREATE TABLE chat_room_users (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(room_id, user_id)
        )
      `);
      console.log("✅ Таблица chat_room_users создана");

      // Индексы для производительности
      await client.query(
        `CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);`
      );
      await client.query(
        `CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);`
      );
      await client.query(
        `CREATE INDEX idx_chat_room_users_room_id ON chat_room_users(room_id);`
      );

      console.log("✅ Индексы для чата созданы");

      // Создаем начальные комнаты чата
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

      console.log("✅ Начальные комнаты чата созданы");
    } else {
      console.log("✅ Таблицы для чата уже существуют");
    }
  } catch (error) {
    console.error("❌ Ошибка создания таблиц для чата:", error);
  }
}

// Экспортируем pool по умолчанию для обратной совместимости
export default getPool();
