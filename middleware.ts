import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = request.cookies.get("session")?.value;

  // Только для HTML страниц (не для статических файлов)
  const isPageRequest =
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.includes(".");

  if (!isPageRequest) {
    return NextResponse.next();
  }

  console.log(
    `📄 Page request: ${pathname}, session: ${session ? "yes" : "no"}`
  );

  // Публичные страницы
  const publicPages = ["/login", "/register", "/", "/db-init"];
  const isPublicPage = publicPages.includes(pathname);

  // Защищенные страницы
  const protectedPages = ["/chat", "/profile", "/settings"];
  const isProtectedPage = protectedPages.some((page) =>
    pathname.startsWith(page)
  );

  // Редирект неавторизованных на защищенные страницы
  if (isProtectedPage && !session) {
    return NextResponse.redirect(
      new URL(`/login?from=${pathname}`, request.url)
    );
  }

  // Редирект авторизованных с логина/регистрации
  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Матчим все, но фильтруем внутри
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
