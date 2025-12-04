const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function createAllMissingTables() {
  console.log("🚀 Создание всех недостающих таблиц...");

  // Получаем пароль из переменных окружения
  const dbPassword = process.env.DB_PASSWORD || "";

  const poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "gamer_messenger",
    user: process.env.DB_USER || "postgres",
    password: dbPassword,
  };

  console.log(
    `Подключаемся к БД ${poolConfig.database} на ${poolConfig.host}:${poolConfig.port}...`
  );

  const pool = new Pool(poolConfig);
  const client = await pool.connect();

  try {
    const tables = [
      {
        name: "friends",
        sql: `
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
        `,
      },
      {
        name: "private_chats",
        sql: `
          CREATE TABLE IF NOT EXISTS private_chats (
            id SERIAL PRIMARY KEY,
            user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user1_id, user2_id),
            CHECK (user1_id < user2_id)
          )
        `,
      },
      {
        name: "private_messages",
        sql: `
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
        `,
      },
    ];

    for (const table of tables) {
      try {
        const check = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table.name}'
          )
        `);

        if (!check.rows[0].exists) {
          console.log(`📦 Создание таблицы ${table.name}...`);
          await client.query(table.sql);
          console.log(`✅ Таблица ${table.name} создана`);
        } else {
          console.log(`✅ Таблица ${table.name} уже существует`);
        }
      } catch (error) {
        console.error(`⚠️ Ошибка с таблицей ${table.name}:`, error.message);
      }
    }

    // Создаем индексы
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id)",
      "CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status)",
      "CREATE INDEX IF NOT EXISTS idx_private_chats_user1_id ON private_chats(user1_id)",
      "CREATE INDEX IF NOT EXISTS idx_private_chats_user2_id ON private_chats(user2_id)",
      "CREATE INDEX IF NOT EXISTS idx_private_chats_last_message_at ON private_chats(last_message_at)",
      "CREATE INDEX IF NOT EXISTS idx_private_messages_chat_id ON private_messages(chat_id)",
      "CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id)",
      "CREATE INDEX IF NOT EXISTS idx_private_messages_receiver_id ON private_messages(receiver_id)",
      "CREATE INDEX IF NOT EXISTS idx_private_messages_is_read ON private_messages(is_read)",
    ];

    for (const index of indexes) {
      try {
        await client.query(index);
      } catch (error) {
        console.log(`✅ Индекс уже существует или ошибка:`, error.message);
      }
    }

    console.log("✅ Все индексы созданы");

    console.log("\n🎉 Все таблицы проверены/созданы!");
  } catch (error) {
    console.error("❌ Ошибка при создании таблиц:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем
createAllMissingTables()
  .then(() => {
    console.log("\n✅ Процесс завершен успешно!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Процесс завершился с ошибкой:", error);
    process.exit(1);
  });
