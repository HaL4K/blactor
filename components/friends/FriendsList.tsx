"use client";

import { useState, useEffect } from "react";

interface Friend {
  id: number;
  username: string;
  email: string;
}

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      console.log("🔄 Загружаю друзей...");
      const response = await fetch("/api/friends");
      const data = await response.json();
      console.log("✅ Данные от /api/friends:", data);

      if (response.ok) {
        // Проверяем разные варианты ответа
        const friendsData = data.friends || data || [];
        console.log("✅ Друзья загружены:", friendsData);
        setFriends(friendsData);
      } else {
        console.error("❌ Ошибка загрузки друзей:", data);
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки друзей:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async () => {
    if (!searchUsername.trim()) return;

    setAddingFriend(true);
    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: searchUsername.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Запрос на дружбу отправлен пользователю ${searchUsername}`);
        setSearchUsername("");
        loadFriends(); // Обновляем список
      } else {
        setMessage(data.error || "Ошибка отправки запроса");
      }
    } catch (error) {
      setMessage("Ошибка при отправке запроса");
    } finally {
      setAddingFriend(false);
    }
  };

  const openChat = (friendId: number) => {
    console.log("🚀 ЗАПУСК СОЗДАНИЯ ЧАТА");
    console.log("Friend ID:", friendId);

    // Показываем уведомление
    alert(`Создаю чат с пользователем ID: ${friendId}`);

    // Отправляем запрос
    fetch("/api/private-chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({ friend_id: friendId }),
    })
      .then((response) => {
        console.log("📥 Ответ получен, статус:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("📦 Данные ответа:", data);

        // Ищем chatId в разных возможных местах
        const chatId = data.chatId || data.id || data.chat_id || data.chatID;

        if (chatId) {
          console.log("✅ Chat ID найден:", chatId);
          console.log("🌐 Перехожу на:", `/private-chat/${chatId}`);

          // Переходим в чат
          window.location.href = `/private-chat/${chatId}`;
        } else {
          console.error("❌ Chat ID не найден в ответе");
          console.error("❌ Все поля ответа:", Object.keys(data));

          // Используем fallback
          const fallbackId = 9999;
          console.log("🔄 Использую fallback ID:", fallbackId);
          window.location.href = `/private-chat/${fallbackId}`;
        }
      })
      .catch((error) => {
        console.error("❌ Ошибка сети:", error);

        // При ошибке сети все равно переходим в тестовый чат
        alert("Ошибка сети, переходим в тестовый чат");
        window.location.href = `/private-chat/9999`;
      });
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
      <h3 className='text-lg font-semibold mb-4'>Друзья</h3>

      {/* Поиск и добавление друга */}
      <div className='mb-6'>
        <div className='flex space-x-2'>
          <input
            type='text'
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder='Введите никнейм пользователя'
            className='flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <button
            onClick={addFriend}
            disabled={addingFriend || !searchUsername.trim()}
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition duration-200'
          >
            {addingFriend ? "Добавление..." : "Добавить"}
          </button>
        </div>
        {message && (
          <div
            className={`mt-2 p-2 rounded ${
              message.includes("Ошибка")
                ? "bg-red-900/50 text-red-300"
                : "bg-green-900/50 text-green-300"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Список друзей */}
      <div className='space-y-3'>
        {friends.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <p>У вас пока нет друзей</p>
            <p className='text-sm mt-2'>Добавьте друзей по никнейму!</p>
          </div>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.id}
              className='flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition duration-200'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center text-white font-bold'>
                  {friend?.username?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className='font-medium'>{friend.username}</div>
                  <div className='text-sm text-gray-400'>{friend.email}</div>
                  <div className='text-xs text-gray-500'>ID: {friend.id}</div>
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => openChat(friend.id)}
                  className='px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition duration-200'
                >
                  Написать
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
