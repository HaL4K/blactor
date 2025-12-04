const { Pool } = require("pg");

async function createNotificationsTable() {
  console.log("🚀 Создание таблицы notifications...");
  const dbPassword = process.env.DB_PASSWORD || "";

  const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "gamer_messenger",
    user: "postgres",
    password: dbPassword, // оставьте пустым или введите ваш пароль
  });

  const client = await pool.connect();

  try {
    // Проверяем, существует ли таблица notifications
    const check = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      )
    `);

    if (check.rows[0].exists) {
      console.log("✅ Таблица notifications уже существует");
      return;
    }

    // Создаем таблицу notifications
    await client.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Таблица notifications создана");

    // Создаем индексы
    await client.query(`
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
    `);
    console.log("✅ Индексы для таблицы notifications созданы");

    console.log("\n🎉 Таблица notifications успешно создана!");
  } catch (error) {
    console.error("❌ Ошибка при создании таблицы notifications:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем создание таблицы
createNotificationsTable()
  .then(() => {
    console.log("\n✅ Создание таблицы завершено успешно!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Создание таблицы завершилось с ошибкой:", error);
    process.exit(1);
  });
