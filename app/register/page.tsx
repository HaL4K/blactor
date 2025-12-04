import RegisterForm from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await getSession();

  if (session) {
    redirect("/chat");
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-black'>
      <RegisterForm />
    </div>
  );
}
