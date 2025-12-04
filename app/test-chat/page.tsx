"use client";

export default function TestChatPage() {
  const testFriends = [
    { id: 2, username: "HaL4K", email: "akvaamericans@gmail.com" },
    { id: 3, username: "Тест1", email: "test1@example.com" },
    { id: 4, username: "Тест2", email: "test2@example.com" },
  ];

  const handleCreateChat = async (friendId: number) => {
    console.log("🟡 Создаю чат с ID:", friendId);

    try {
      const response = await fetch("/api/private-chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friend_id: friendId }),
      });

      const data = await response.json();
      console.log("🟡 Ответ сервера:", data);

      if (response.ok) {
        alert(`✅ Чат создан! ID: ${data.chatId}`);
      } else {
        alert(`❌ Ошибка: ${data.error}`);
      }
    } catch (error: any) {
      console.error("❌ Ошибка сети:", error);
      alert("❌ Ошибка сети: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Тестовая страница создания чата</h1>
      <p>Проверка API создания чата</p>

      <div style={{ marginTop: "20px" }}>
        <h3>Друзья для теста:</h3>
        <table
          border={1}
          cellPadding='10'
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {testFriends.map((friend) => (
              <tr key={friend.id}>
                <td>{friend.id}</td>
                <td>{friend.username}</td>
                <td>{friend.email}</td>
                <td>
                  <button
                    onClick={() => handleCreateChat(friend.id)}
                    style={{ padding: "5px 10px", cursor: "pointer" }}
                  >
                    Создать чат
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <h3>Ручной ввод ID:</h3>
        <input
          type='number'
          id='manualFriendId'
          placeholder='Введите ID друга'
          defaultValue='2'
          style={{ padding: "5px", marginRight: "10px" }}
        />
        <button
          onClick={() => {
            const input = document.getElementById(
              "manualFriendId"
            ) as HTMLInputElement;
            handleCreateChat(parseInt(input.value));
          }}
          style={{ padding: "5px 10px" }}
        >
          Создать чат с этим ID
        </button>
      </div>
    </div>
  );
}
