import { auth } from "@/lib/authn";
import { redirect } from "next/navigation";
import SignInForm from "./SignInForm";
import { AuthHeader } from "@/components/ui/AuthHeader";

export default async function SignInPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="bg-root flex min-h-screen flex-col items-center justify-center py-12">
      <AuthHeader title="Sign in" />
      <SignInForm />
    </main>
  );
}
