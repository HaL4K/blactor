"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useEffect } from "react";

interface FriendRequest {
  id: number;
  user_id: number;
  friend_id: number;
  status: string;
  created_at: string;
  sender_username?: string;
  sender_email?: string;
  friend_username?: string;
  friend_email?: string;
}

interface FriendRequestsProps {
  onChatCreated?: () => void; // Добавляем callback для обновления чатов
}

export default function FriendRequests({ onChatCreated }: FriendRequestsProps) {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useWebSocket();

  useEffect(() => {
    fetchFriendRequests();

    // Подписываемся на события WebSocket для обновлений
    if (socket) {
      socket.on("friendRequestUpdate", () => {
        fetchFriendRequests();
      });

      return () => {
        socket.off("friendRequestUpdate");
      };
    }
  }, [socket]);

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch("/api/friends/requests");
      if (response.ok) {
        const data = await response.json();
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки запросов в друзья:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (
    requestId: number,
    action: "accept" | "reject"
  ) => {
    try {
      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      if (response.ok) {
        const data = await response.json();

        if (action === "accept" && data.chatCreated) {
          console.log(`✅ Чат создан с ID: ${data.chatId}`);

          // Обновляем список запросов
          fetchFriendRequests();

          // Уведомляем родительский компонент о создании чата
          if (onChatCreated) {
            onChatCreated();
          }

          // Можно также показать сообщение пользователю
          alert(`Запрос принят! Теперь вы можете общаться в приватном чате.`);
        } else {
          // Просто обновляем список для отклоненных запросов
          fetchFriendRequests();
        }

        if (socket) {
          socket.emit("friendRequestResponse", { requestId, action });
        }
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Ошибка обработки запроса:", error);
      alert("Ошибка при обработке запроса");
    }
  };

  const handleCancel = async (requestId: number) => {
    try {
      const response = await fetch(
        `/api/friends/cancel?friendId=${requestId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchFriendRequests();
      }
    } catch (error) {
      console.error("Ошибка отмены запроса:", error);
    }
  };

  if (loading) {
    return <div className='text-center py-4'>Загрузка...</div>;
  }

  return (
    <div className='space-y-6'>
      {/* Входящие запросы */}
      {incomingRequests.length > 0 && (
        <div>
          <h3 className='text-lg font-semibold mb-3'>Входящие запросы</h3>
          <div className='space-y-3'>
            {incomingRequests.map((request) => (
              <div
                key={request.id}
                className='bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex justify-between items-center'
              >
                <div>
                  <p className='font-medium'>{request.sender_username}</p>
                  <p className='text-sm text-gray-500'>
                    {request.sender_email}
                  </p>
                  <p className='text-xs text-gray-400'>
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => handleRespond(request.id, "accept")}
                    className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200'
                  >
                    Принять
                  </button>
                  <button
                    onClick={() => handleRespond(request.id, "reject")}
                    className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200'
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Исходящие запросы */}
      {outgoingRequests.length > 0 && (
        <div>
          <h3 className='text-lg font-semibold mb-3'>Исходящие запросы</h3>
          <div className='space-y-3'>
            {outgoingRequests.map((request) => (
              <div
                key={request.id}
                className='bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex justify-between items-center'
              >
                <div>
                  <p className='font-medium'>{request.friend_username}</p>
                  <p className='text-sm text-gray-500'>
                    {request.friend_email}
                  </p>
                  <p className='text-xs text-gray-400'>
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancel(request.id)}
                  className='px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200'
                >
                  Отменить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
        <p className='text-center text-gray-500 py-8'>
          <span className='text-2xl block mb-2'>📭</span>
          Нет активных запросов в друзья
        </p>
      )}
    </div>
  );
}
