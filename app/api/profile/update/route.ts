import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const pool = getPool();

    await pool.query(
      `UPDATE player_profiles 
       SET bio = $1, favorite_games = $2, game_tags = $3 
       WHERE user_id = $4`,
      [body.bio, body.favorite_games, body.game_tags, session.userId]
    );

    return NextResponse.json({ message: "Профиль обновлен" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Profile update error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { error: "Ошибка обновления профиля", details: errorMessage },
      { status: 500 }
    );
  }
}
