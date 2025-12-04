const { getPool } = require("../lib/db");

async function createPrivateTables() {
  console.log("🚀 Создание таблиц для приватных чатов...");

  const pool = getPool();
  const client = await pool.connect();

  try {
    // 1. Таблица друзей
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
    console.log("✅ Таблица friends создана/проверена");

    // 2. Таблица приватных чатов
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
    console.log("✅ Таблица private_chats создана/проверена");

    // 3. Таблица приватных сообщений
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
    console.log("✅ Таблица private_messages создана/проверена");

    // 4. Индексы
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
    `);
    console.log("✅ Индексы созданы/проверены");

    console.log("\n🎉 Все таблицы успешно созданы!");
  } catch (error) {
    console.error("❌ Ошибка при создании таблиц:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Запускаем миграцию
createPrivateTables()
  .then(() => {
    console.log("\n✅ Миграция завершена успешно!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Миграция завершилась с ошибкой:", error);
    process.exit(1);
  });
