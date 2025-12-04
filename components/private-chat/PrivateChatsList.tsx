"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Chat {
  id: number;
  other_username: string;
  other_user_id: number;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export default function PrivateChatsList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
    // Обновляем список каждые 10 секунд
    const interval = setInterval(loadChats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadChats = async () => {
    try {
      const response = await fetch("/api/private-chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='p-4'>
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto'></div>
      </div>
    );
  }

  return (
    <div className='bg-gray-800/50 rounded-lg p-4'>
      <h3 className='text-lg font-semibold mb-4'>Диалоги</h3>

      <div className='space-y-2'>
        {chats.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <p>Нет диалогов</p>
            <p className='text-sm mt-2'>Добавьте друзей и начните общение!</p>
          </div>
        ) : (
          chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/private-chat/${chat.id}`}
              className={`block p-3 rounded-lg transition duration-200 ${
                chat.unread_count > 0
                  ? "bg-blue-600/20 border border-blue-500/30"
                  : "bg-gray-700/30 hover:bg-gray-700/50"
              }`}
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold'>
                  {chat.other_username?.charAt(0)?.toUpperCase() || ""}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex justify-between items-center'>
                    <div className='font-medium truncate'>
                      {chat.other_username}
                    </div>
                    {chat.unread_count > 0 && (
                      <span className='px-2 py-1 bg-red-600 text-white text-xs rounded-full'>
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                  {chat.last_message && (
                    <div className='text-sm text-gray-400 truncate'>
                      {chat.last_message}
                    </div>
                  )}
                  {chat.last_message_time && (
                    <div className='text-xs text-gray-500'>
                      {new Date(chat.last_message_time).toLocaleDateString(
                        "ru-RU"
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
