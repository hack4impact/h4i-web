import { auth } from "@/lib/authn";
import { redirect } from "next/navigation";
import SignUpForm from "./SignUpForm";

export default async function SignUpPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUpForm />
    </main>
  );
}
