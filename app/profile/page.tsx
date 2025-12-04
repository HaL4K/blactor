import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const pool = getPool();

  // Получаем профиль игрока
  const profileResult = await pool.query(
    `SELECT p.*, u.email, u.username, u.created_at 
     FROM player_profiles p 
     JOIN users u ON p.user_id = u.id 
     WHERE u.id = $1`,
    [session.userId]
  );

  const profile = profileResult.rows[0] || {};

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Профиль игрока</h1>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Основная информация */}
          <div className='md:col-span-2 space-y-6'>
            <div className='bg-gray-800 rounded-lg p-6'>
              <h2 className='text-xl font-semibold mb-4'>
                Основная информация
              </h2>
              <div className='space-y-3'>
                <div>
                  <label className='text-gray-400 text-sm'>
                    Игровой никнейм
                  </label>
                  <div className='text-lg font-semibold'>
                    {session.username}
                  </div>
                </div>
                <div>
                  <label className='text-gray-400 text-sm'>Email</label>
                  <div className='text-lg'>{session.email}</div>
                </div>
                <div>
                  <label className='text-gray-400 text-sm'>
                    Дата регистрации
                  </label>
                  <div className='text-lg'>
                    {new Date(profile.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div>
                  <label className='text-gray-400 text-sm'>Уровень</label>
                  <div className='text-lg font-semibold text-yellow-400'>
                    Уровень {profile.level || 1}
                  </div>
                </div>
              </div>
            </div>

            {/* О себе */}
            <div className='bg-gray-800 rounded-lg p-6'>
              <h2 className='text-xl font-semibold mb-4'>О себе</h2>
              {profile.bio ? (
                <p className='text-gray-300'>{profile.bio}</p>
              ) : (
                <p className='text-gray-500 italic'>
                  Расскажите о себе в настройках профиля
                </p>
              )}
            </div>
          </div>

          {/* Боковая панель */}
          <div className='space-y-6'>
            {/* Любимые игры */}
            <div className='bg-gray-800 rounded-lg p-6'>
              <h2 className='text-xl font-semibold mb-4'>Любимые игры</h2>
              {profile.favorite_games && profile.favorite_games.length > 0 ? (
                <ul className='space-y-2'>
                  {profile.favorite_games.map((game: string, index: number) => (
                    <li key={index} className='text-gray-300'>
                      🎮 {game}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-gray-500 italic'>Добавьте любимые игры</p>
              )}
            </div>

            {/* Игровые теги */}
            <div className='bg-gray-800 rounded-lg p-6'>
              <h2 className='text-xl font-semibold mb-4'>Теги</h2>
              {profile.game_tags && profile.game_tags.length > 0 ? (
                <div className='flex flex-wrap gap-2'>
                  {profile.game_tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-blue-600 rounded-full text-sm'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 italic'>Добавьте игровые теги</p>
              )}
            </div>

            {/* Действия */}
            <div className='bg-gray-800 rounded-lg p-6'>
              <h2 className='text-xl font-semibold mb-4'>Действия</h2>
              <div className='space-y-3'>
                <button className='w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200'>
                  Редактировать профиль
                </button>
                <button className='w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md transition duration-200'>
                  Сменить пароль
                </button>
                <button className='w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md transition duration-200'>
                  Удалить аккаунт
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
