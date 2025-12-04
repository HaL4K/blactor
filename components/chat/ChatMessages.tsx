"use client";

import { useEffect, useRef } from "react";

interface Message {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  created_at: string;
  username: string;
}

interface Room {
  id: number;
  name: string;
  description: string;
  is_private: boolean;
  created_by: number;
  created_at: string;
}

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: number;
  room: Room;
}

export default function ChatMessages({
  messages,
  currentUserId,
  room,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Прокручиваем вниз при получении новых сообщений
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return "Сегодня";
    }

    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Группируем сообщения по датам
  const groupedMessages = messages.reduce(
    (groups: Record<string, Message[]>, message) => {
      const date = formatDate(message.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {}
  );

  return (
    <div className='bg-gray-800/50 rounded-lg p-4 h-full flex flex-col'>
      {/* Заголовок комнаты */}
      <div className='mb-4 pb-3 border-b border-gray-700'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-xl font-semibold'>{room.name}</h3>
            {room.description && (
              <p className='text-gray-400 text-sm mt-1'>{room.description}</p>
            )}
          </div>
          {room.is_private && (
            <span className='px-3 py-1 bg-purple-600/50 text-purple-300 text-sm rounded-full'>
              Приватная
            </span>
          )}
        </div>
      </div>

      {/* Сообщения */}
      <div className='flex-1 overflow-y-auto space-y-6 pb-4'>
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Дата */}
            <div className='flex items-center justify-center my-4'>
              <div className='px-4 py-1 bg-gray-700/50 text-gray-400 text-sm rounded-full'>
                {date}
              </div>
            </div>

            {/* Сообщения за эту дату */}
            {dateMessages.map((message) => {
              const isOwnMessage = message.user_id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex mb-4 ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage
                        ? "bg-blue-600/30 border border-blue-500/30"
                        : "bg-gray-700/30 border border-gray-600/30"
                    }`}
                  >
                    {/* Имя пользователя и время для чужих сообщений */}
                    {!isOwnMessage && (
                      <div className='flex items-center justify-between mb-1'>
                        <span className='font-medium text-blue-300'>
                          {message.username}
                        </span>
                        <span className='text-xs text-gray-500 ml-2'>
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Время для своих сообщений */}
                    {isOwnMessage && (
                      <div className='flex justify-end mb-1'>
                        <span className='text-xs text-gray-500'>
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Текст сообщения */}
                    <p className='text-white whitespace-pre-wrap break-words'>
                      {message.content}
                    </p>

                    {/* Статус для своих сообщений */}
                    {isOwnMessage && (
                      <div className='flex justify-end mt-1'>
                        <span className='text-xs text-gray-500'>
                          ✓ Доставлено
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {messages.length === 0 && (
          <div className='flex flex-col items-center justify-center h-full text-center py-12'>
            <div className='text-5xl mb-4 opacity-50'>💬</div>
            <h4 className='text-xl font-semibold mb-2'>Нет сообщений</h4>
            <p className='text-gray-400 max-w-md'>
              Напишите первое сообщение в комнате "{room.name}"
            </p>
          </div>
        )}

        {/* Элемент для прокрутки вниз */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
