"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

interface UseWebSocketProps {
  userId?: number;
  roomId?: number;
}

export function useWebSocket({ userId, roomId }: UseWebSocketProps = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Инициализация WebSocket
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
    console.log(`🔄 Подключение к WebSocket: ${socketUrl}`);

    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("✅ WebSocket подключен");
      setIsConnected(true);

      // Аутентифицируем пользователя если есть
      if (userId) {
        socketInstance.emit("authenticate", userId);
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ WebSocket отключен");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Ошибка подключения WebSocket:", error);
    });

    // Получение истории комнаты
    socketInstance.on(
      "roomHistory",
      (data: { roomId: number; messages: Message[] }) => {
        console.log(
          "📜 Получена история комнаты:",
          data.roomId,
          data.messages.length,
          "сообщений"
        );
        setMessages(data.messages);
      }
    );

    // Новое сообщение
    socketInstance.on("newMessage", (message: Message) => {
      console.log("📨 Получено новое сообщение:", message);
      setMessages((prev) => [...prev, message]);
    });

    // Пользователь присоединился
    socketInstance.on("userJoined", (data) => {
      console.log("👤 Пользователь присоединился:", data);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [userId]);

  // Присоединение к комнате
  useEffect(() => {
    if (socketRef.current && isConnected && roomId) {
      console.log(`🔗 Присоединяемся к комнате ${roomId}`);
      socketRef.current.emit("joinRoom", roomId);
    }
  }, [roomId, isConnected]);

  // Аутентификация пользователя
  const authenticate = useCallback(
    (userId: number) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("authenticate", userId);
        return true;
      }
      return false;
    },
    [isConnected]
  );

  // Присоединение к комнате
  const joinRoom = useCallback(
    (roomId: number) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("joinRoom", roomId);
        return true;
      }
      return false;
    },
    [isConnected]
  );

  // Отправка сообщения
  const sendMessage = useCallback(
    (data: {
      roomId: number;
      content: string;
      senderId: number;
      senderName: string;
    }) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("sendMessage", data);
        return true;
      }
      return false;
    },
    [isConnected]
  );

  // Выход из комнаты
  const leaveRoom = useCallback(
    (roomId: number) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("leaveRoom", roomId);
      }
    },
    [isConnected]
  );

  return {
    socket,
    isConnected,
    messages,
    authenticate,
    joinRoom,
    sendMessage,
    leaveRoom,
  };
}
