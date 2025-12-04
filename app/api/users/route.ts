import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.created_at, 
              p.game_tags, p.favorite_games, p.avatar_url, p.bio, p.level
       FROM users u
       LEFT JOIN player_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
