const { Pool } = require("pg");

async function createFriendsTable() {
  console.log("🚀 Создание таблицы friends...");

  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "gamer_messenger",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  });

  const client = await pool.connect();

  try {
    // 1. Проверяем, существует ли таблица friends
    const check = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'friends'
      )
    `);

    if (check.rows[0].exists) {
      console.log("✅ Таблица friends уже существует");
      return;
    }

    // 2. Создаем таблицу friends
    await client.query(`
      CREATE TABLE friends (
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

    // 3. Создаем индексы
    await client.query(`
      CREATE INDEX idx_friends_user_id ON friends(user_id);
      CREATE INDEX idx_friends_friend_id ON friends(friend_id);
      CREATE INDEX idx_friends_status ON friends(status);
    `);
    console.log("✅ Индексы для таблицы friends созданы");

    console.log("\n🎉 Таблица friends успешно создана!");
  } catch (error) {
    console.error("❌ Ошибка при создании таблицы friends:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем создание таблицы
createFriendsTable()
  .then(() => {
    console.log("\n✅ Создание таблицы завершено успешно!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Создание таблицы завершилось с ошибкой:", error);
    process.exit(1);
  });
