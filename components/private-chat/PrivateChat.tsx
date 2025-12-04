"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  is_read: boolean;
  is_delivered: boolean;
  created_at: string;
  sender_username: string;
  receiver_username: string;
}

interface Chat {
  id: number;
  user1_id: number;
  user2_id: number;
  other_username: string;
  other_user_id: number;
}

export default function PrivateChat({ chatId }: { chatId: number }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      loadChat();
      loadMessages();
      // Устанавливаем интервал для обновления сообщений
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [userId, chatId]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check");
      if (response.ok) {
        const data = await response.json();
        setUserId(data.user.id);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/login");
    }
  };

  const loadChat = async () => {
    try {
      const response = await fetch(`/api/private-chats/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setChat(data.chat);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/private-chats/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);

        // Прокручиваем вниз
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/private-chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (response.ok) {
        setNewMessage("");
        loadMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/private-chats/${chatId}/read`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>💬</div>
          <h3 className='text-xl font-semibold mb-2'>Чат не найден</h3>
          <p className='text-gray-400'>Вернитесь к списку диалогов</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col'>
      {/* Заголовок чата */}
      <div className='bg-gray-800/50 p-4 border-b border-gray-700'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold'>
            {chat.other_username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className='font-semibold'>{chat.other_username}</h3>
            <p className='text-sm text-gray-400'>Личные сообщения</p>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-6xl mb-4'>👋</div>
            <h3 className='text-xl font-semibold mb-2'>Начните диалог</h3>
            <p className='text-gray-400'>
              Отправьте первое сообщение {chat.other_username}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === userId;

            return (
              <div
                key={message.id}
                className={`flex ${
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
                  {!isOwnMessage && (
                    <div className='font-medium text-sm text-blue-300 mb-1'>
                      {message.sender_username}
                    </div>
                  )}

                  <div className='text-white whitespace-pre-wrap break-words'>
                    {message.content}
                  </div>

                  <div className='flex justify-between items-center mt-2'>
                    <div className='text-xs text-gray-500'>
                      {formatTime(message.created_at)}
                    </div>
                    {isOwnMessage && (
                      <div className='flex items-center space-x-1 ml-2'>
                        {message.is_delivered && (
                          <span className='text-green-500'>✓</span>
                        )}
                        {message.is_read && (
                          <span className='text-blue-500'>✓✓</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки сообщения */}
      <div className='p-4 border-t border-gray-700'>
        <form onSubmit={sendMessage} className='flex space-x-3'>
          <input
            type='text'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={markAsRead}
            placeholder='Введите сообщение...'
            className='flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            disabled={sending}
          />
          <button
            type='submit'
            disabled={sending || !newMessage.trim()}
            className='px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition duration-200'
          >
            {sending ? (
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto'></div>
            ) : (
              "Отправить"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
