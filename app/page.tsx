export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-black'>
      <div className='container mx-auto px-4 py-16'>
        <div className='text-center'>
          <h1 className='text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>
            Gamer Messenger
          </h1>
          <p className='text-xl mb-8 text-gray-300'>
            Общайтесь с игроками со всего мира. Координация команд, поиск
            тиммейтов, живые обсуждения игр.
          </p>

          <div className='max-w-2xl mx-auto bg-gray-800 p-8 rounded-xl mb-12'>
            <h2 className='text-2xl font-semibold mb-6 text-white'>
              Возможности платформы
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='p-4 bg-gray-700 rounded-lg'>
                <div className='text-blue-400 text-2xl mb-2'>🎮</div>
                <h3 className='font-semibold mb-2'>Игровые чаты</h3>
                <p className='text-sm text-gray-300'>
                  Специализированные чаты для разных игр
                </p>
              </div>
              <div className='p-4 bg-gray-700 rounded-lg'>
                <div className='text-green-400 text-2xl mb-2'>👥</div>
                <h3 className='font-semibold mb-2'>Поиск команды</h3>
                <p className='text-sm text-gray-300'>
                  Найдите тиммейтов для совместной игры
                </p>
              </div>
              <div className='p-4 bg-gray-700 rounded-lg'>
                <div className='text-purple-400 text-2xl mb-2'>🚀</div>
                <h3 className='font-semibold mb-2'>Голосовой чат</h3>
                <p className='text-sm text-gray-300'>
                  Встроенная голосовая связь для команд
                </p>
              </div>
            </div>
          </div>

          <div className='space-x-4'>
            <a
              href='/register'
              className='inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200'
            >
              Начать бесплатно
            </a>
            <a
              href='/login'
              className='inline-block px-8 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition duration-200'
            >
              Войти в аккаунт
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
