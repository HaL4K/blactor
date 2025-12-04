"use client";

import { useState } from "react";

interface Room {
  id: number;
  name: string;
  description: string;
  is_private: boolean;
  created_by: number;
  created_at: string;
}

interface ChatRoomsProps {
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onCreateRoom: (name: string, description: string, isPrivate: boolean) => void;
  currentUserId: number;
}

export default function ChatRooms({
  rooms,
  selectedRoom,
  onSelectRoom,
  onCreateRoom,
  currentUserId,
}: ChatRoomsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName, newRoomDescription, newRoomIsPrivate);
      setNewRoomName("");
      setNewRoomDescription("");
      setNewRoomIsPrivate(false);
      setShowCreateForm(false);
    }
  };

  return (
    <div className='bg-gray-800/50 rounded-lg p-4 h-full flex flex-col'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-semibold'>Комнаты</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className='px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition duration-200'
        >
          {showCreateForm ? "Отмена" : "Создать"}
        </button>
      </div>

      {/* Форма создания комнаты */}
      {showCreateForm && (
        <div className='mb-4 p-3 bg-gray-700/50 rounded-lg'>
          <input
            type='text'
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder='Название комнаты'
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <textarea
            value={newRoomDescription}
            onChange={(e) => setNewRoomDescription(e.target.value)}
            placeholder='Описание (необязательно)'
            className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            rows={2}
          />
          <div className='flex items-center mb-3'>
            <input
              type='checkbox'
              id='isPrivate'
              checked={newRoomIsPrivate}
              onChange={(e) => setNewRoomIsPrivate(e.target.checked)}
              className='mr-2'
            />
            <label htmlFor='isPrivate' className='text-sm text-gray-300'>
              Приватная комната
            </label>
          </div>
          <button
            onClick={handleCreateRoom}
            disabled={!newRoomName.trim()}
            className='w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition duration-200'
          >
            Создать
          </button>
        </div>
      )}

      {/* Список комнат */}
      <div className='flex-1 overflow-y-auto space-y-2'>
        {rooms.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <p>Нет доступных комнат</p>
            <p className='text-sm mt-2'>Создайте первую комнату!</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`p-3 rounded-lg cursor-pointer transition duration-200 ${
                selectedRoom?.id === room.id
                  ? "bg-blue-600/30 border border-blue-500"
                  : "bg-gray-700/30 hover:bg-gray-700/50"
              }`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center'>
                    <span className='font-medium'>{room.name}</span>
                    {room.is_private && (
                      <span className='ml-2 px-2 py-0.5 bg-purple-600/50 text-purple-300 text-xs rounded-full'>
                        приватная
                      </span>
                    )}
                    {room.created_by === currentUserId && (
                      <span className='ml-2 px-2 py-0.5 bg-green-600/50 text-green-300 text-xs rounded-full'>
                        ваша
                      </span>
                    )}
                  </div>
                  {room.description && (
                    <p className='text-sm text-gray-400 mt-1 truncate'>
                      {room.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
