const { createServer } = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");

// Подключение к PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gamer_messenger",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

console.log("🚀 Создание WebSocket сервера...");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_APP_URL
        : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

console.log("✅ WebSocket сервер инициализирован");

io.on("connection", (socket) => {
  console.log(`🔌 Новое подключение: ${socket.id}`);

  // Аутентификация пользователя
  socket.on("authenticate", async (userId) => {
    try {
      const userResult = await pool.query(
        "SELECT id, username FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        socket.data.userId = user.id;
        socket.data.username = user.username;
        console.log(
          `✅ Пользователь аутентифицирован: ${user.username} (${socket.id})`
        );
      }
    } catch (error) {
      console.error("Ошибка аутентификации:", error);
    }
  });

  // Присоединение к комнате
  socket.on("joinRoom", async (roomId) => {
    try {
      socket.join(`room_${roomId}`);
      console.log(`👥 ${socket.id} присоединился к комнате ${roomId}`);

      // Получаем историю сообщений из БД
      const messagesResult = await pool.query(
        `SELECT m.*, u.username as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.room_id = $1
         ORDER BY m.created_at DESC
         LIMIT 50`,
        [roomId]
      );

      // Отправляем историю пользователю
      socket.emit("roomHistory", {
        roomId,
        messages: messagesResult.rows.reverse(), // возвращаем в правильном порядке
      });

      // Уведомляем остальных участников
      socket.to(`room_${roomId}`).emit("userJoined", {
        userId: socket.data.userId,
        username: socket.data.username,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Ошибка присоединения к комнате:", error);
    }
  });

  // Отправка сообщения
  socket.on("sendMessage", async (data) => {
    try {
      const { roomId, content, senderId, senderName } = data;

      console.log(
        `📨 Новое сообщение в комнате ${roomId} от ${senderName}: ${content}`
      );

      // Сохраняем сообщение в БД
      const messageResult = await pool.query(
        `INSERT INTO messages (room_id, sender_id, content) 
         VALUES ($1, $2, $3) 
         RETURNING id, created_at`,
        [roomId, senderId, content]
      );

      const message = {
        id: messageResult.rows[0].id,
        room_id: roomId,
        sender_id: senderId,
        sender_name: senderName,
        content: content,
        created_at: messageResult.rows[0].created_at,
      };

      // Обновляем время последнего сообщения в комнате
      await pool.query(
        `UPDATE chat_rooms 
         SET last_message_at = $1 
         WHERE id = $2`,
        [messageResult.rows[0].created_at, roomId]
      );

      // Отправляем сообщение всем участникам комнаты
      io.to(`room_${roomId}`).emit("newMessage", message);
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      socket.emit("messageError", { error: "Не удалось отправить сообщение" });
    }
  });

  // Выход из комнаты
  socket.on("leaveRoom", (roomId) => {
    socket.leave(`room_${roomId}`);
    console.log(`👋 ${socket.id} вышел из комнаты ${roomId}`);
  });

  // Отключение
  socket.on("disconnect", () => {
    console.log(`🔌 Отключение: ${socket.id}`);
  });
});

const WS_PORT = process.env.WS_PORT || 3002;
httpServer.listen(WS_PORT, () => {
  console.log(`🚀 WebSocket сервер запущен на порту ${WS_PORT}`);
});
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3001 });

// Храним подписки по chatId
const subscriptions = new Map();

wss.on("connection", (ws) => {
  console.log("🔌 Новое подключение");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("📨 WebSocket сообщение:", data);

      if (data.type === "subscribe") {
        // Подписываем пользователя на чат
        const { chatId } = data;

        if (!subscriptions.has(chatId)) {
          subscriptions.set(chatId, new Set());
        }

        subscriptions.get(chatId).add(ws);
        console.log(`✅ Пользователь подписан на чат ${chatId}`);

        // Отправляем историю сообщений
        // Здесь можно загружать из БД
        ws.send(
          JSON.stringify({
            type: "message_history",
            chatId,
            messages: [],
          })
        );
      }

      if (data.type === "send_message") {
        // Рассылаем сообщение всем подписчикам чата
        const { chatId, message: msg } = data;

        if (subscriptions.has(chatId)) {
          subscriptions.get(chatId).forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "new_message",
                  chatId,
                  message: msg,
                })
              );
            }
          });
        }
      }
    } catch (error) {
      console.error("❌ Ошибка обработки WebSocket сообщения:", error);
    }
  });

  ws.on("close", () => {
    console.log("🔌 Отключение");
    // Удаляем отключенные соединения из подписок
    subscriptions.forEach((clients, chatId) => {
      clients.delete(ws);
      if (clients.size === 0) {
        subscriptions.delete(chatId);
      }
    });
  });
});

console.log("🚀 WebSocket сервер запущен на порту 3001");
