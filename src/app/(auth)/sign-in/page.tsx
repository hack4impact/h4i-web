import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import SignInForm from "./SignInForm";

// Relative paths only; "//host" and "/\host" would be open redirects.
function safeCallbackUrl(value: string | undefined): string {
  if (!value) return "/dashboard";
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/dashboard";
  }
  return value;
}

// Codes set by /api/auth/magic-link/verify.
const ERROR_MESSAGES: Record<string, string> = {
  "missing-token": "That sign-in link is incomplete. Request a new one.",
  "invalid-link":
    "That sign-in link is invalid, expired, or was already used. Request a new one.",
  "server-error": "Something went wrong signing you in. Please try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await getCurrentSession();
  if (session) redirect("/dashboard");

  const { callbackUrl, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignInForm
        callbackUrl={safeCallbackUrl(callbackUrl)}
        initialError={error ? (ERROR_MESSAGES[error] ?? null) : null}
      />
    </main>
  );
}
