"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface Message {
  id: number;
  sender_id: number;
  receiver_id?: number;
  content: string;
  created_at: string;
  sender_username?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

export default function PrivateChatPage() {
  const params = useParams();
  const chatId = params?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Получаем текущего пользователя
  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error("Ошибка загрузки пользователя:", err));
  }, []);

  // 2. Загружаем историю сообщений
  useEffect(() => {
    if (!chatId) return;

    loadMessages();
    setLoading(false);

    // 3. Подключаемся к WebSocket
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("✅ WebSocket подключен");
      // Подписываемся на сообщения этого чата
      ws.send(
        JSON.stringify({
          type: "subscribe",
          chatId: parseInt(chatId as string),
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WebSocket сообщение:", data);

      if (data.type === "new_message") {
        // Добавляем новое сообщение в список
        setMessages((prev) => [...prev, data.message]);
      }

      if (data.type === "message_history") {
        // Загружаем историю сообщений
        setMessages(data.messages || []);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket ошибка:", error);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket отключен");
    };

    setSocket(ws);

    // Интервал для обновления (на случай если WebSocket отвалится)
    const interval = setInterval(loadMessages, 5000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [chatId]);

  // 3. Функция загрузки сообщений
  const loadMessages = async () => {
    if (!chatId) return;

    try {
      const response = await fetch(`/api/private-chats/${chatId}/messages`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки сообщений:", error);
    }
  };

  // 4. Функция отправки сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    // Оптимистичное обновление - сразу показываем сообщение
    const tempMessage: Message = {
      id: Date.now(), // временный ID
      sender_id: currentUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender_username: currentUser.username,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Отправляем на сервер
      const response = await fetch(`/api/private-chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка отправки");
      }

      // Заменяем временное сообщение на реальное
      if (data.messageData) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id ? data.messageData : msg
          )
        );
      }

      // Отправляем через WebSocket другим участникам
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "send_message",
            chatId: parseInt(chatId as string),
            message: {
              ...tempMessage,
              id: data.messageData?.id || tempMessage.id,
            },
          })
        );
      }
    } catch (error: any) {
      console.error("Ошибка отправки сообщения:", error);
      alert("Ошибка отправки: " + error.message);

      // Удаляем временное сообщение при ошибке
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  // 5. Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col'>
      {/* Шапка чата */}
      <div className='bg-gray-800 p-4 border-b border-gray-700'>
        <div className='max-w-6xl mx-auto flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-bold'>
              💬 Чат #{chatId}
              {currentUser && ` (Вы: ${currentUser.username})`}
            </h1>
            <div className='flex items-center space-x-2 text-sm text-gray-400'>
              <div
                className={`w-2 h-2 rounded-full ${
                  socket?.readyState === WebSocket.OPEN
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span>
                {socket?.readyState === WebSocket.OPEN ? "Онлайн" : "Офлайн"}
              </span>
              <span>•</span>
              <span>{messages.length} сообщений</span>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className='px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg'
          >
            ← Назад
          </button>
        </div>
      </div>

      {/* Список сообщений */}
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='max-w-3xl mx-auto space-y-4'>
          {messages.length === 0 ? (
            <div className='text-center py-12 text-gray-500'>
              <div className='text-4xl mb-4'>💬</div>
              <p className='text-lg'>Начните общение в этом чате!</p>
              <p className='text-sm mt-2'>Сообщения будут появляться здесь</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUser?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className='max-w-xs lg:max-w-md'>
                    {/* Имя отправителя для чужих сообщений */}
                    {!isOwn && message.sender_username && (
                      <div className='text-xs text-gray-400 mb-1 ml-1'>
                        {message.sender_username}
                      </div>
                    )}

                    {/* Сообщение */}
                    <div
                      className={`rounded-lg p-3 ${
                        isOwn
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-700 text-white rounded-bl-none"
                      }`}
                    >
                      <div className='break-words'>{message.content}</div>
                      <div className='text-xs opacity-75 mt-1 text-right'>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Статус для своих сообщений */}
                    {isOwn && (
                      <div className='text-xs text-gray-400 mt-1 text-right'>
                        {message.id > 0 ? "✓ Доставлено" : "🕐 Отправляется..."}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Форма отправки */}
      <div className='bg-gray-800 border-t border-gray-700 p-4'>
        <div className='max-w-3xl mx-auto'>
          <div className='flex space-x-2'>
            <input
              type='text'
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder='Введите сообщение...'
              className='flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={socket?.readyState !== WebSocket.OPEN}
            />
            <button
              onClick={sendMessage}
              disabled={
                !newMessage.trim() || socket?.readyState !== WebSocket.OPEN
              }
              className='px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition duration-200'
            >
              Отправить
            </button>
          </div>

          {/* Статус соединения */}
          <div className='mt-3 text-sm text-gray-400'>
            {socket?.readyState === WebSocket.OPEN ? (
              <div className='flex items-center'>
                <div className='w-2 h-2 bg-green-500 rounded-full mr-2'></div>
                <span>
                  Соединение установлено. Сообщения обновляются в реальном
                  времени.
                </span>
              </div>
            ) : (
              <div className='flex items-center'>
                <div className='w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse'></div>
                <span>
                  Нет соединения с сервером. Сообщения могут приходить с
                  задержкой.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
