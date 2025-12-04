"use client";

import { useState } from "react";

export default function SendFriendRequest() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage({ type: "error", text: "Введите никнейм" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Запрос отправлен пользователю ${data.friend.username}`,
        });
        setUsername("");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Ошибка отправки запроса",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Ошибка соединения",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='flex gap-2'>
          <input
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder='Введите никнейм пользователя'
            className='flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={loading}
          />
          <button
            type='submit'
            disabled={loading}
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200 disabled:opacity-50'
          >
            {loading ? "Отправка..." : "Добавить"}
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.type === "success"
                ? "bg-green-900/30 border border-green-700"
                : "bg-red-900/30 border border-red-700"
            }`}
          >
            <p
              className={
                message.type === "success" ? "text-green-400" : "text-red-400"
              }
            >
              {message.text}
            </p>
          </div>
        )}
      </form>

      <div className='mt-4 text-sm text-gray-400'>
        <p>✏️ Введите точный никнейм пользователя (регистр важен)</p>
      </div>
    </div>
  );
}
