import { Server } from "socket.io";
import { createServer } from "http";
import { getPool } from "./db";

// Типы для WebSocket сообщений
export interface SocketUser {
  userId: number;
  username: string;
  socketId: string;
}

export interface ChatMessage {
  id?: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
}

// Глобальное хранилище подключенных пользователей
const connectedUsers: Map<number, string> = new Map(); // userId -> socketId
const userRooms: Map<number, Set<number>> = new Map(); // userId -> Set<roomId>

class WebSocketServer {
  private io: Server;
  private httpServer: ReturnType<typeof createServer>;

  constructor() {
    this.httpServer = createServer();
    this.io = new Server(this.httpServer, {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? process.env.NEXT_PUBLIC_APP_URL
            : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`🔌 Новое подключение: ${socket.id}`);

      // Аутентификация пользователя
      socket.on("authenticate", async (userId: number) => {
        try {
          const pool = getPool();
          const userResult = await pool.query(
            "SELECT id, username FROM users WHERE id = $1",
            [userId]
          );

          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];

            // Сохраняем связь userId -> socketId
            connectedUsers.set(userId, socket.id);

            // Присваиваем пользователю комнаты, в которых он состоит
            const roomsResult = await pool.query(
              "SELECT room_id FROM room_members WHERE user_id = $1",
              [userId]
            );

            roomsResult.rows.forEach((row: any) => {
              socket.join(`room_${row.room_id}`);
            });

            console.log(
              `✅ Пользователь аутентифицирован: ${user.username} (${socket.id})`
            );

            // Уведомляем всех о новом онлайн пользователе
            this.io.emit("userOnline", {
              userId: user.id,
              username: user.username,
            });
          }
        } catch (error) {
          console.error("Ошибка аутентификации:", error);
        }
      });

      // Присоединение к комнате
      socket.on("joinRoom", async (roomId: number, userId: number) => {
        try {
          socket.join(`room_${roomId}`);

          // Сохраняем информацию о комнате пользователя
          if (!userRooms.has(userId)) {
            userRooms.set(userId, new Set());
          }
          userRooms.get(userId)?.add(roomId);

          console.log(`👥 Пользователь присоединился к комнате ${roomId}`);

          // Уведомляем остальных участников комнаты
          socket.to(`room_${roomId}`).emit("userJoinedRoom", {
            userId,
            roomId,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Ошибка присоединения к комнате:", error);
        }
      });

      // Отправка сообщения
      socket.on(
        "sendMessage",
        async (message: Omit<ChatMessage, "id" | "timestamp">) => {
          try {
            const pool = getPool();
            const timestamp = new Date();

            // Сохраняем сообщение в БД
            const result = await pool.query(
              `INSERT INTO messages (room_id, sender_id, content, created_at) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
              [message.roomId, message.senderId, message.content, timestamp]
            );

            const savedMessage: ChatMessage = {
              id: result.rows[0].id,
              ...message,
              timestamp,
            };

            // Отправляем сообщение всем в комнате, включая отправителя
            this.io
              .to(`room_${message.roomId}`)
              .emit("newMessage", savedMessage);

            // Обновляем время последнего сообщения в комнате
            await pool.query(
              `UPDATE chat_rooms 
             SET last_message_at = $1 
             WHERE id = $2`,
              [timestamp, message.roomId]
            );
          } catch (error) {
            console.error("Ошибка отправки сообщения:", error);
            socket.emit("messageError", {
              error: "Не удалось отправить сообщение",
            });
          }
        }
      );

      // Выход из комнаты
      socket.on("leaveRoom", (roomId: number, userId: number) => {
        socket.leave(`room_${roomId}`);
        userRooms.get(userId)?.delete(roomId);

        socket.to(`room_${roomId}`).emit("userLeftRoom", {
          userId,
          roomId,
          timestamp: new Date(),
        });
      });

      // Отключение пользователя
      socket.on("disconnect", () => {
        // Находим userId по socketId
        let disconnectedUserId: number | null = null;

        connectedUsers.forEach((socketId, userId) => {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
            connectedUsers.delete(userId);
          }
        });

        if (disconnectedUserId) {
          console.log(`🔌 Пользователь отключился: ${socket.id}`);

          // Уведомляем всех о выходе пользователя
          this.io.emit("userOffline", { userId: disconnectedUserId });
        }
      });

      // Получение онлайн пользователей в комнате
      socket.on("getOnlineUsers", async (roomId: number) => {
        try {
          const pool = getPool();

          // Получаем всех пользователей комнаты
          const membersResult = await pool.query(
            `SELECT u.id, u.username 
             FROM users u
             JOIN room_members rm ON u.id = rm.user_id
             WHERE rm.room_id = $1`,
            [roomId]
          );

          // Фильтруем тех, кто онлайн
          const onlineUsers = membersResult.rows
            .filter((user: any) => connectedUsers.has(user.id))
            .map((user: any) => ({
              userId: user.id,
              username: user.username,
            }));

          socket.emit("onlineUsers", { roomId, users: onlineUsers });
        } catch (error) {
          console.error("Ошибка получения онлайн пользователей:", error);
        }
      });
    });
  }

  start(port: number = 3001) {
    this.httpServer.listen(port, () => {
      console.log(`🚀 WebSocket сервер запущен на порту ${port}`);
    });
  }

  getIO() {
    return this.io;
  }
}

// Экспортируем singleton экземпляр
const webSocketServer = new WebSocketServer();
export default webSocketServer;
