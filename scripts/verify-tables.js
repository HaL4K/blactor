const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

async function checkTables() {
  console.log("🔍 Проверка таблиц базы данных...");

  const password = process.env.DB_PASSWORD || "postgres";
  const env = { ...process.env, PGPASSWORD: password };

  try {
    // Проверяем существование таблиц
    const checkQuery = `
SELECT 
  table_name
FROM 
  information_schema.tables 
WHERE 
  table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
    `;

    const { stdout, stderr } = await execAsync(
      `psql -h localhost -p 5432 -U postgres -d gamer_messenger -c "${checkQuery}"`,
      { env }
    );

    if (stderr) {
      console.error("Ошибка проверки таблиц:", stderr);
      return false;
    }

    console.log("📋 Существующие таблицы:");
    console.log(stdout);

    // Создаем недостающие таблицы
    const createTablesSQL = `
-- Создаем таблицу chat_rooms если не существует
CREATE TABLE IF NOT EXISTS chat_rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу chat_messages если не существует
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу chat_room_users если не существует
CREATE TABLE IF NOT EXISTS chat_room_users (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- Создаем индексы если не существуют
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_users_room_id ON chat_room_users(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_users_user_id ON chat_room_users(user_id);
    `;

    console.log("📦 Создание недостающих таблиц...");

    const createResult = await execAsync(
      `psql -h localhost -p 5432 -U postgres -d gamer_messenger -c "${createTablesSQL}"`,
      { env }
    );

    if (
      createResult.stderr &&
      !createResult.stderr.includes("already exists")
    ) {
      console.error("Ошибка создания таблиц:", createResult.stderr);
    } else {
      console.log("✅ Таблицы успешно созданы/проверены");
    }

    // Создаем начальные комнаты если их нет
    const seedRoomsSQL = `
-- Добавляем начальные комнаты
INSERT INTO chat_rooms (name, description, is_private, created_by) 
SELECT 'Общий чат', 'Основная комната для всех пользователей', FALSE, id
FROM users 
WHERE email = 'admin@example.com' OR id = 1
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO chat_rooms (name, description, is_private, created_by) 
SELECT 'Игровой зал', 'Обсуждение игр и стратегий', FALSE, id
FROM users 
WHERE email = 'admin@example.com' OR id = 1
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO chat_rooms (name, description, is_private, created_by) 
SELECT 'Только для своих', 'Приватная комната', TRUE, id
FROM users 
WHERE email = 'admin@example.com' OR id = 1
LIMIT 1
ON CONFLICT DO NOTHING;

-- Добавляем всех пользователей в общий чат
INSERT INTO chat_room_users (room_id, user_id)
SELECT cr.id, u.id
FROM chat_rooms cr
CROSS JOIN users u
WHERE cr.name = 'Общий чат'
ON CONFLICT (room_id, user_id) DO NOTHING;
    `;

    console.log("🌱 Добавление начальных данных...");

    const seedResult = await execAsync(
      `psql -h localhost -p 5432 -U postgres -d gamer_messenger -c "${seedRoomsSQL}"`,
      { env }
    );

    if (seedResult.stderr && !seedResult.stderr.includes("already exists")) {
      console.error("Ошибка добавления начальных данных:", seedResult.stderr);
    } else {
      console.log("✅ Начальные данные добавлены");
    }

    return true;
  } catch (error) {
    console.error("❌ Ошибка проверки таблиц:", error.message);
    return false;
  }
}

async function main() {
  console.log("=== Проверка и создание таблиц чата ===\n");

  const success = await checkTables();

  if (success) {
    console.log("\n✅ Все таблицы готовы к использованию!");
    console.log("\n🚀 Запустите чат:");
    console.log("   http://localhost:3000/chat");
  } else {
    console.log("\n❌ Не удалось создать таблицы");
    console.log("\n💡 Попробуйте выполнить вручную:");
    console.log("   psql -U postgres -d gamer_messenger");
    console.log("   Затем выполните SQL команды из файла lib/db.ts");
  }
}

main();
