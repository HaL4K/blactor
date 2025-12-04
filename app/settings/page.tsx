"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    bio: "",
    favoriteGames: "",
    gameTags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: formData.bio,
          favorite_games: formData.favoriteGames
            .split(",")
            .map((g) => g.trim()),
          game_tags: formData.gameTags.split(",").map((t) => t.trim()),
        }),
      });

      if (response.ok) {
        setMessage("Профиль успешно обновлен!");
        router.refresh();
      } else {
        const data = await response.json();
        setMessage(data.error || "Ошибка обновления профиля");
      }
    } catch (error) {
      setMessage("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Настройки профиля</h1>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.includes("успешно")
                  ? "bg-green-900/50"
                  : "bg-red-900/50"
              }`}
            >
              {message}
            </div>
          )}

          <div className='bg-gray-800 rounded-lg p-6'>
            <h2 className='text-xl font-semibold mb-4'>Информация о себе</h2>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder='Расскажите о себе...'
              className='w-full h-32 px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div className='bg-gray-800 rounded-lg p-6'>
            <h2 className='text-xl font-semibold mb-4'>Любимые игры</h2>
            <input
              type='text'
              value={formData.favoriteGames}
              onChange={(e) =>
                setFormData({ ...formData, favoriteGames: e.target.value })
              }
              placeholder='CS:GO, Dota 2, Minecraft (через запятую)'
              className='w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div className='bg-gray-800 rounded-lg p-6'>
            <h2 className='text-xl font-semibold mb-4'>Игровые теги</h2>
            <input
              type='text'
              value={formData.gameTags}
              onChange={(e) =>
                setFormData({ ...formData, gameTags: e.target.value })
              }
              placeholder='Стрелок, Стратег, РПГ (через запятую)'
              className='w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </form>
      </div>
    </div>
  );
}
