import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gamer Messenger - Чат для геймеров",
  description: "Общайтесь с игроками со всего мира",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ru'>
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <Navigation />
        <main className='min-h-screen'>{children}</main>
        <footer className='bg-gray-800 p-6 text-center text-gray-400'>
          <p>
            © {new Date().getFullYear()} Gamer Messenger. Все права защищены.
          </p>
          <p className='text-sm mt-2'>Общайтесь, играйте, находите друзей!</p>
        </footer>
      </body>
    </html>
  );
}
