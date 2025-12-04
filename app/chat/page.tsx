"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import FriendsList from "@/components/friends/FriendsList";
import PrivateChatsList from "@/components/private-chat/PrivateChatsList";
import FriendRequests from "@/components/FriendRequests";
import Notifications from "@/components/Notifications";
import SendFriendRequest from "@/components/SendFriendRequest";

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chats" | "friends">("chats");
  const [refreshChats, setRefreshChats] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check");
      if (!response.ok) {
        throw new Error("Не авторизован");
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error("Auth error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Функция для обновления списка приватных чатов
  const handleChatCreated = useCallback(() => {
    // Переключаемся на вкладку чатов
    setActiveTab("chats");

    // Устанавливаем флаг для обновления списка чатов
    setRefreshChats((prev) => !prev);

    // Можно добавить небольшую задержку для обновления
    setTimeout(() => {
      // Принудительное обновление компонента PrivateChatsList
      setRefreshChats((prev) => !prev);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
          <p className='mt-4'>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-black text-white'>
      {/* Заголовок */}
      <div className='bg-gray-800/50 border-b border-gray-700'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center space-x-4'>
              <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>
                Gamer Messenger
              </h1>
              <div className='hidden md:block'>
                <p className='text-gray-400'>
                  Добро пожаловать,{" "}
                  <span className='text-blue-400 font-semibold'>
                    {user.username}
                  </span>
                  !
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <Notifications />
              <button
                onClick={handleLogout}
                className='px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition duration-200'
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className='border-b border-gray-700'>
        <div className='container mx-auto px-4'>
          <div className='flex space-x-4'>
            <button
              onClick={() => setActiveTab("chats")}
              className={`px-4 py-3 border-b-2 transition duration-200 ${
                activeTab === "chats"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              💬 Диалоги
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`px-4 py-3 border-b-2 transition duration-200 ${
                activeTab === "friends"
                  ? "border-green-500 text-green-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              👥 Друзья
            </button>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className='container mx-auto px-4 py-6'>
        {activeTab === "chats" ? (
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            <div className='lg:col-span-1'>
              <PrivateChatsList key={refreshChats ? "refresh" : "normal"} />
            </div>
            <div className='lg:col-span-3'>
              <div className='bg-gray-800/50 rounded-lg h-[600px] flex flex-col items-center justify-center p-8'>
                <div className='text-6xl mb-4'>💬</div>
                <h3 className='text-xl font-semibold mb-2 text-center'>
                  Выберите диалог
                </h3>
                <p className='text-gray-400 text-center mb-6'>
                  или начните новый разговор с другом
                </p>
                <button
                  onClick={() => setActiveTab("friends")}
                  className='px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200 flex items-center'
                >
                  <span className='mr-2'>👥</span>
                  Перейти к друзьям
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            <div className='lg:col-span-1'>
              <FriendsList />
            </div>
            <div className='lg:col-span-3'>
              <div className='space-y-6'>
                {/* Форма отправки запроса в друзья */}
                <div className='bg-gray-800/50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold mb-4 flex items-center'>
                    <span className='mr-2'>➕</span> Добавить друга
                  </h3>
                  <SendFriendRequest />
                </div>

                {/* Запросы в друзья */}
                <div className='bg-gray-800/50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold mb-4 flex items-center'>
                    <span className='mr-2'>📨</span> Запросы в друзья
                  </h3>
                  <FriendRequests onChatCreated={handleChatCreated} />
                </div>

                {/* Информация о друзьях */}
                <div className='bg-gray-800/50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold mb-4 flex items-center'>
                    <span className='mr-2'>ℹ️</span> Информация
                  </h3>
                  <p className='text-gray-400 mb-4'>
                    После принятия запроса в друзья автоматически создается
                    приватный чат. Перейдите на вкладку "Диалоги" чтобы начать
                    общение.
                  </p>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='p-4 bg-gray-700/30 rounded-lg'>
                      <h4 className='font-medium mb-2 flex items-center'>
                        <span className='mr-2'>💬</span> Приватные чаты
                      </h4>
                      <p className='text-sm text-gray-400'>
                        Создаются автоматически при добавлении в друзья
                      </p>
                    </div>
                    <div className='p-4 bg-gray-700/30 rounded-lg'>
                      <h4 className='font-medium mb-2 flex items-center'>
                        <span className='mr-2'>🔒</span> Приватность
                      </h4>
                      <p className='text-sm text-gray-400'>
                        Сообщения видны только участникам чата
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
