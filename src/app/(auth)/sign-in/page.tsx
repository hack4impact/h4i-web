import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import SignInForm from "./SignInForm";

/**
 * Only accept a relative, single-slash path. A value like
 * "https://evil.example" or "//evil.example" would otherwise turn this page
 * into an open redirect: an attacker links someone to
 * /sign-in?callbackUrl=https://evil.example, they sign in normally, and land
 * on a convincing fake.
 */
function safeCallbackUrl(value: string | undefined): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getCurrentSession();
  if (session) redirect("/dashboard");

  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignInForm callbackUrl={safeCallbackUrl(callbackUrl)} />
    </main>
  );
}
