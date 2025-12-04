import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey =
  process.env.SESSION_SECRET || "your-secret-key-change-in-production";
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload extends JWTPayload {
  userId: number;
  email: string;
  username: string;
  expires: Date;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    if (!session) {
      return null;
    }

    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    });

    return {
      userId: Number(payload.userId),
      email: String(payload.email),
      username: String(payload.username),
      expires: payload.expires ? new Date(String(payload.expires)) : new Date(),
      ...payload,
    };
  } catch (error: unknown) {
    console.error("❌ Failed to verify session:", error);
    return null;
  }
}

export async function createSession(
  userId: number,
  email: string,
  username: string
): Promise<Response> {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, email, username, expires });

  // Создаем JSON ответ с установкой cookie
  const response = new Response(
    JSON.stringify({
      message: "Успешный вход",
      user: { id: userId, email, username },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${session}; Path=/; HttpOnly; ${
          process.env.NODE_ENV === "production" ? "Secure; " : ""
        }SameSite=Lax; Expires=${expires.toUTCString()}`,
      },
    }
  );

  return response;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const sessionCookie = cookieStore.get("session");
    console.log(
      "🔍 Session cookie:",
      sessionCookie
        ? {
            name: sessionCookie.name,
            hasValue: !!sessionCookie.value,
            valueLength: sessionCookie.value?.length,
          }
        : "No session cookie found"
    );

    if (!sessionCookie?.value) {
      return null;
    }

    const parsed = await decrypt(sessionCookie.value);

    return parsed;
  } catch (error: unknown) {
    console.error("❌ Error getting session:", error);
    return null;
  }
}

export async function updateSession(
  request: NextRequest
): Promise<NextResponse | void> {
  const session = request.cookies.get("session")?.value;

  if (!session) return;

  const parsed = await decrypt(session);
  if (!parsed) return;

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const res = NextResponse.next();

  res.cookies.set({
    name: "session",
    value: await encrypt({ ...parsed, expires }),
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res;
}

export async function logout(): Promise<Response> {
  // Создаем редирект на главную страницу
  const response = new Response(
    JSON.stringify({ message: "Выход выполнен успешно" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=; Path=/; HttpOnly; ${
          process.env.NODE_ENV === "production" ? "Secure; " : ""
        }SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      },
    }
  );

  return response;
}
