"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { RegisterData } from "@/lib/types";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }

      router.push("/chat");
      router.refresh();
    } catch (err: unknown) {
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
        Регистрация в Gamer Messenger
      </h2>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {error && (
          <div className='p-3 bg-red-500 text-white rounded'>{error}</div>
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
            placeholder='Ваш email'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Игровой никнейм
          </label>
          <input
            type='text'
            name='username'
            value={formData.username}
            onChange={handleChange}
            required
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Придумайте никнейм'
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
            placeholder='Не менее 6 символов'
            minLength={6}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Подтвердите пароль
          </label>
          <input
            type='password'
            name='confirmPassword'
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Повторите пароль'
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>

      <p className='mt-4 text-center text-gray-400'>
        Уже есть аккаунт?{" "}
        <a href='/login' className='text-blue-400 hover:text-blue-300'>
          Войти
        </a>
      </p>
    </div>
  );
}
