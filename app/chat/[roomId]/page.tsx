"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
}

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function ChatRoomPage({ params }: PageProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState<number>();
  const [roomInfo, setRoomInfo] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [user, setUser] = useState<{ id: number; username: string } | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, messages, sendMessage } = useWebSocket({
    userId: user?.id,
    roomId,
  });

  useEffect(() => {
    const loadParams = async () => {
      const { roomId } = await params;
      setRoomId(parseInt(roomId));
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    const checkAuthAndLoadRoom = async () => {
      try {
        const authResponse = await fetch("/api/auth/check");
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setUser(authData.user);

          // Загружаем информацию о комнате
          const roomsResponse = await fetch("/api/chat/rooms");
          if (roomsResponse.ok) {
            const roomsData = await roomsResponse.json();
            const room = roomsData.rooms.find((r: any) => r.id === roomId);
            if (room) {
              setRoomInfo({
                name: room.name,
                description: room.description || "",
              });
            } else {
              router.push("/chat");
            }
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Ошибка загрузки:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      checkAuthAndLoadRoom();
    }
  }, [roomId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId || sending) return;

    try {
      setSending(true);

      const success = sendMessage({
        roomId,
        content: newMessage,
        senderId: user.id,
        senderName: user.username,
      });

      if (success) {
        setNewMessage("");
      } else {
        // Fallback: отправка через REST API
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            content: newMessage,
          }),
        });
        setNewMessage("");
      }
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Сегодня";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Вчера";
    } else {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
          <p className='mt-4 text-gray-300'>Загрузка чата...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-black text-white'>
      <div className='container mx-auto px-4 py-8'>
        {/* Заголовок */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => router.push("/chat")}
              className='px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition duration-200'
            >
              ← Назад
            </button>
            <div>
              <h1 className='text-2xl font-bold'>{roomInfo?.name}</h1>
              <div className='flex items-center space-x-2'>
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className='text-sm text-gray-400'>
                  {isConnected ? "Подключено" : "Отключено"}
                </span>
                <span className='text-sm text-gray-400'>•</span>
                <span className='text-sm text-gray-400'>
                  {messages.length} сообщений
                </span>
              </div>
            </div>
          </div>

          <div className='text-right'>
            <p className='text-gray-400'>
              Вы:{" "}
              <span className='text-blue-400 font-semibold'>
                {user?.username}
              </span>
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Боковая панель */}
          <div className='lg:col-span-1 space-y-6'>
            <div className='bg-gray-800 rounded-xl p-6'>
              <h3 className='font-semibold mb-4'>Информация о чате</h3>
              <div className='space-y-3'>
                <div>
                  <p className='text-gray-400 text-sm'>Название</p>
                  <p className='font-semibold'>{roomInfo?.name}</p>
                </div>
                <div>
                  <p className='text-gray-400 text-sm'>Описание</p>
                  <p className='text-sm'>
                    {roomInfo?.description || "Нет описания"}
                  </p>
                </div>
                <div>
                  <p className='text-gray-400 text-sm'>Сообщений</p>
                  <p className='font-semibold'>{messages.length}</p>
                </div>
              </div>
            </div>

            <div className='bg-gray-800 rounded-xl p-6'>
              <h3 className='font-semibold mb-4'>Быстрые действия</h3>
              <div className='space-y-2'>
                <button className='w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200'>
                  🎤 Голосовой чат
                </button>
                <button className='w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200'>
                  🎮 Пригласить в игру
                </button>
                <button className='w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200'>
                  📎 Прикрепить файл
                </button>
              </div>
            </div>
          </div>

          {/* Основное окно чата */}
          <div className='lg:col-span-3'>
            <div className='bg-gray-800 rounded-xl flex flex-col h-[70vh]'>
              {/* Список сообщений */}
              <div className='flex-1 overflow-y-auto p-6 space-y-6'>
                {messages.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    <p className='text-lg'>Нет сообщений</p>
                    <p className='text-sm mt-2'>Начните общение первым!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const showDate =
                      index === 0 ||
                      formatDate(messages[index - 1].created_at) !==
                        formatDate(message.created_at);

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className='text-center my-4'>
                            <span className='px-4 py-1 bg-gray-700 rounded-full text-sm text-gray-300'>
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex ${
                            message.sender_id === user?.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] ${
                              message.sender_id === user?.id
                                ? "bg-blue-600"
                                : "bg-gray-700"
                            } rounded-xl p-4`}
                          >
                            <div className='flex justify-between items-start mb-2'>
                              <div
                                className={`font-semibold ${
                                  message.sender_id === user?.id
                                    ? "text-blue-200"
                                    : "text-gray-300"
                                }`}
                              >
                                {message.sender_id === user?.id
                                  ? "Вы"
                                  : message.sender_name}
                              </div>
                              <div className='text-xs text-gray-400 ml-4'>
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                            <div className='text-white'>{message.content}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Форма отправки сообщения */}
              <div className='p-6 border-t border-gray-700'>
                <form onSubmit={handleSendMessage}>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        isConnected ? "Введите сообщение..." : "Подключение..."
                      }
                      disabled={!isConnected || sending}
                      className='flex-1 px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <button
                      type='submit'
                      disabled={!isConnected || sending || !newMessage.trim()}
                      className='px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 disabled:opacity-50'
                    >
                      {sending ? "Отправка..." : "Отправить"}
                    </button>
                  </div>
                  <div className='mt-2 text-sm text-gray-400'>
                    {isConnected
                      ? "💬 Сообщения отправляются в реальном времени"
                      : "⏳ Ожидание подключения..."}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
