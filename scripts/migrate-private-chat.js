const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

async function migrate() {
  console.log("🚀 Запуск миграции для приватных чатов и друзей...");

  const password = process.env.DB_PASSWORD || "postgres";
  const env = { ...process.env, PGPASSWORD: password };

  try {
    // Создаем таблицы
    const sql = `
-- Таблица друзей
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Таблица приватных чатов
CREATE TABLE IF NOT EXISTS private_chats (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- Таблица приватных сообщений
CREATE TABLE IF NOT EXISTS private_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES private_chats(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_delivered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
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
    `;

    const { stdout, stderr } = await execAsync(
      `psql -h localhost -p 5432 -U postgres -d gamer_messenger -c "${sql}"`,
      { env }
    );

    if (stderr && !stderr.includes("already exists")) {
      console.error("Ошибка миграции:", stderr);
    } else {
      console.log("✅ Миграция успешно завершена!");
      console.log(
        "📋 Созданы таблицы: friends, private_chats, private_messages, notifications"
      );
    }
  } catch (error) {
    console.error("❌ Ошибка миграции:", error.message);
  }
}

migrate();
