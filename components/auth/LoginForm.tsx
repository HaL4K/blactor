"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { LoginData } from "@/lib/types";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("📨 Login response:", data);
      console.log("📨 Response status:", response.status);

      // Проверяем заголовки Set-Cookie
      const setCookieHeader = response.headers.get("Set-Cookie");
      console.log("🍪 Set-Cookie header:", setCookieHeader);

      if (!response.ok) {
        throw new Error(data.error || "Ошибка входа");
      }

      // Ждем немного чтобы cookie установился
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("✅ Redirecting to /chat...");
      router.push("/chat");
      router.refresh();
    } catch (err: unknown) {
      console.error("❌ Login error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("Неизвестная ошибка");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className='max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-lg shadow-lg'>
      <h2 className='text-2xl font-bold mb-6 text-center text-white'>
        Вход в Gamer Messenger
      </h2>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {error && (
          <div className='p-3 bg-red-500 text-white rounded'>
            <p className='font-semibold'>Ошибка:</p>
            <p>{error}</p>
          </div>
        )}

        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Email
          </label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            required
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Введите email'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Пароль
          </label>
          <input
            type='password'
            name='password'
            value={formData.password}
            onChange={handleChange}
            required
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Введите пароль'
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full py-2 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>

      <p className='mt-4 text-center text-gray-400'>
        Нет аккаунта?{" "}
        <a href='/register' className='text-blue-400 hover:text-blue-300'>
          Зарегистрироваться
        </a>
      </p>

      <div className='mt-6 pt-4 border-t border-gray-700'>
        <p className='text-sm text-gray-500 text-center'>
          Для отладки:{" "}
          <a
            href='/test-session'
            className='text-yellow-400 hover:text-yellow-300'
          >
            Тест сессии
          </a>
        </p>
      </div>
    </div>
  );
}
