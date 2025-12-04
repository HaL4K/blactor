"use client";

import { useState, KeyboardEvent, FormEvent } from "react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='bg-gray-800/50 rounded-lg p-4'>
      <div className='flex items-end space-x-3'>
        {/* Поле ввода */}
        <div className='flex-1 relative'>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Введите сообщение...'
            className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
            rows={1}
            style={{ minHeight: "44px", maxHeight: "120px" }}
            disabled={isSending}
          />

          {/* Подсказка о горячих клавишах */}
          <div className='absolute bottom-2 right-2 text-xs text-gray-500'>
            Enter для отправки, Shift+Enter для новой строки
          </div>
        </div>

        {/* Кнопка отправки */}
        <button
          type='submit'
          disabled={!message.trim() || isSending}
          className='px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition duration-200 flex items-center justify-center min-w-[100px]'
        >
          {isSending ? (
            <>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
              <span>Отправка...</span>
            </>
          ) : (
            <>
              <span>Отправить</span>
              <svg
                className='w-5 h-5 ml-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Кнопки быстрых действий */}
      <div className='flex flex-wrap gap-2 mt-3'>
        <button
          type='button'
          onClick={() => onSendMessage("Привет! 👋")}
          className='px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition duration-200'
        >
          Привет! 👋
        </button>
        <button
          type='button'
          onClick={() => onSendMessage("Кто играет? 🎮")}
          className='px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition duration-200'
        >
          Кто играет? 🎮
        </button>
        <button
          type='button'
          onClick={() => onSendMessage("Го в игру? 🚀")}
          className='px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition duration-200'
        >
          Го в игру? 🚀
        </button>
        <button
          type='button'
          onClick={() => onSendMessage("Победили! 🏆")}
          className='px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition duration-200'
        >
          Победили! 🏆
        </button>
      </div>
    </form>
  );
}
