const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "gamer_messenger",
  user: "postgres",
  password: "",
});

async function checkDatabase() {
  console.log("🔍 Проверка базы данных...\n");

  const client = await pool.connect();

  try {
    // 1. Пользователи
    console.log("1. 👤 ПОЛЬЗОВАТЕЛИ:");
    const users = await client.query(
      "SELECT id, username, email FROM users ORDER BY id"
    );
    users.rows.forEach((user) => {
      console.log(`   ${user.id}. ${user.username} (${user.email})`);
    });

    // 2. Друзья
    console.log("\n2. 🤝 ДРУЗЬЯ:");
    const friends = await client.query(`
      SELECT 
        f.id,
        u1.username as sender,
        u2.username as receiver,
        f.status,
        f.created_at
      FROM friends f
      JOIN users u1 ON f.user_id = u1.id
      JOIN users u2 ON f.friend_id = u2.id
      ORDER BY f.created_at DESC
    `);

    if (friends.rows.length === 0) {
      console.log("   ❌ Нет записей в таблице friends");
    } else {
      friends.rows.forEach((f) => {
        console.log(
          `   ID: ${f.id} | ${f.sender} → ${f.receiver} | Статус: ${
            f.status
          } | ${new Date(f.created_at).toLocaleString()}`
        );
      });
    }

    // 3. Приватные чаты
    console.log("\n3. 💬 ПРИВАТНЫЕ ЧАТЫ:");
    const chats = await client.query(`
      SELECT 
        pc.id as chat_id,
        u1.username as user1,
        u2.username as user2,
        pc.created_at
      FROM private_chats pc
      JOIN users u1 ON pc.user1_id = u1.id
      JOIN users u2 ON pc.user2_id = u2.id
      ORDER BY pc.created_at DESC
    `);

    if (chats.rows.length === 0) {
      console.log("   ❌ Нет приватных чатов");
    } else {
      chats.rows.forEach((c) => {
        console.log(
          `   Чат ID: ${c.chat_id} | ${c.user1} ↔ ${
            c.user2
          } | Создан: ${new Date(c.created_at).toLocaleString()}`
        );
      });
    }

    // 4. Уведомления
    console.log("\n4. 🔔 УВЕДОМЛЕНИЯ:");
    const notifications = await client.query(`
      SELECT 
        n.id,
        u.username as recipient,
        n.type,
        n.message,
        n.is_read,
        n.created_at
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);

    if (notifications.rows.length === 0) {
      console.log("   ❌ Нет уведомлений");
    } else {
      notifications.rows.forEach((n) => {
        console.log(
          `   ID: ${n.id} | Для: ${n.recipient} | Тип: ${n.type} | Прочитано: ${
            n.is_read
          } | ${new Date(n.created_at).toLocaleString()}`
        );
        console.log(`      Сообщение: ${n.message}`);
      });
    }
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
