"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
  sender_username: string | null;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useWebSocket();

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on("newNotification", () => {
        fetchNotifications();
      });

      return () => {
        socket.off("newNotification");
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(
          data.notifications.filter((n: Notification) => !n.is_read).length
        );
      }
    } catch (error) {
      console.error("Ошибка загрузки уведомлений:", error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Ошибка пометки уведомления:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notification of notifications.filter((n) => !n.is_read)) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error("Ошибка пометки всех уведомлений:", error);
    }
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700'
      >
        <Bell className='w-6 h-6' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50'>
          <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
            <h3 className='font-semibold'>Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className='text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1'
              >
                <Check className='w-4 h-4' />
                Прочитать все
              </button>
            )}
          </div>

          <div className='max-h-96 overflow-y-auto'>
            {notifications.length > 0 ? (
              <div className='divide-y divide-gray-200 dark:divide-gray-700'>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 ${
                      !notification.is_read
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div className='flex justify-between'>
                      <p className='font-medium'>
                        {notification.type === "friend_request"
                          ? "Запрос в друзья"
                          : "Другое"}
                      </p>
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className='text-xs text-gray-500 hover:text-gray-700'
                        >
                          <Check className='w-4 h-4' />
                        </button>
                      )}
                    </div>
                    <p className='mt-1 text-sm'>{notification.message}</p>
                    <p className='mt-2 text-xs text-gray-500'>
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-8 text-center text-gray-500'>
                Нет уведомлений
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
