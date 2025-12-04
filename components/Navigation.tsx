"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  username: string;
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Проверяем сессию только на клиенте
    checkAuth();
  }, [pathname]); // Перепроверяем при смене страницы

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Показываем скелетон во время загрузки
  if (loading) {
    return (
      <nav className='bg-gray-800 p-4'>
        <div className='container mx-auto flex justify-between items-center'>
          <div className='h-8 w-32 bg-gray-700 rounded animate-pulse'></div>
          <div className='h-8 w-24 bg-gray-700 rounded animate-pulse'></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className='bg-gray-800 p-4'>
      <div className='container mx-auto flex justify-between items-center'>
        <div className='flex items-center space-x-6'>
          <Link
            href='/'
            className={`text-xl font-bold ${
              pathname === "/"
                ? "text-blue-400"
                : "text-white hover:text-blue-300"
            }`}
          >
            Gamer Messenger
          </Link>

          {user && (
            <>
              <Link
                href='/chat'
                className={`${
                  pathname === "/chat"
                    ? "text-blue-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Чат
              </Link>
              <Link
                href='/profile'
                className={`${
                  pathname === "/profile"
                    ? "text-blue-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Профиль
              </Link>
            </>
          )}
        </div>

        <div className='flex items-center space-x-4'>
          {user ? (
            <>
              <span className='text-gray-300 hidden md:inline'>
                Привет,{" "}
                <span className='font-semibold text-blue-300'>
                  {user.username}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className='px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition duration-200'
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href='/login'
                className={`px-4 py-2 rounded-md transition duration-200 ${
                  pathname === "/login"
                    ? "bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Войти
              </Link>
              <Link
                href='/register'
                className={`px-4 py-2 rounded-md transition duration-200 ${
                  pathname === "/register"
                    ? "bg-gray-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
