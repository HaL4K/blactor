import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?from=/chat");
  }

  return <>{children}</>;
}
