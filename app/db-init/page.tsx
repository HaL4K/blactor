"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DBInitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const initDatabase = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/init-db");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    router.push("/register");
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8'>
      <div className='max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6'>Инициализация базы данных</h1>

        <div className='bg-gray-800 p-6 rounded-lg mb-6'>
          <h2 className='text-xl font-semibold mb-4'>Текущее состояние:</h2>
          <div className='space-y-2 text-sm'>
            <div className='flex items-center'>
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  result?.success ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></div>
              <span>
                База данных:{" "}
                {result?.success ? "Готова" : "Требует инициализации"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={initDatabase}
          disabled={loading}
          className='w-full py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6'
        >
          {loading ? "Создание таблиц..." : "Создать таблицы базы данных"}
        </button>

        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success ? "bg-green-900/50" : "bg-red-900/50"
            }`}
          >
            {result.success ? (
              <>
                <div className='flex items-center mb-2'>
                  <span className='text-green-400 text-2xl mr-2'>✓</span>
                  <h3 className='text-lg font-semibold'>Успешно!</h3>
                </div>
                <p>{result.message}</p>
                <div className='mt-6'>
                  <button
                    onClick={goToRegister}
                    className='py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200'
                  >
                    Перейти к регистрации
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className='flex items-center mb-2'>
                  <span className='text-red-400 text-2xl mr-2'>✗</span>
                  <h3 className='text-lg font-semibold'>Ошибка</h3>
                </div>
                <p>{result.error}</p>
              </>
            )}
          </div>
        )}

        <div className='mt-8 p-4 bg-gray-800 rounded-lg'>
          <h3 className='font-semibold mb-2'>Если есть проблемы:</h3>
          <div className='space-y-2 text-sm'>
            <p>1. Проверьте, что PostgreSQL запущен</p>
            <p>
              2. Убедитесь, что в файле .env.local указаны правильные данные:
            </p>
            <code className='block p-2 bg-gray-900 rounded text-green-400'>
              {`DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamer_messenger
DB_USER=postgres
DB_PASSWORD=ваш_пароль`}
            </code>
            <p>3. Создайте базу данных вручную через psql:</p>
            <code className='block p-2 bg-gray-900 rounded text-green-400'>
              createdb gamer_messenger
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
