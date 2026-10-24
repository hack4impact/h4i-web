"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDivider } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormField,
  FormLabel,
  FormInput,
  FormError,
} from "@/components/ui/Form";

export default function SignInForm({
  callbackUrl = "/dashboard",
}: {
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  // Set once a link has been requested; switches the card to a confirmation.
  const [sentTo, setSentTo] = useState<string | null>(null);

  function switchMode(next: "password" | "magic") {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (mode === "magic") {
      return handleMagicLink(e);
    }

    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      // fetch only rejects on network failure. A 401 arrives here as a
      // perfectly resolved promise, so the status must be checked by hand --
      // wrapping this in try/catch alone would treat a failed login as success.
      if (!response.ok) {
        setError("Invalid email or password.");
        setIsPending(false);
        return;
      }

      // The session cookie is set by the response. refresh() re-renders the
      // server components, which still have the signed-out state cached.
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setIsPending(false);
    }
  }

  async function handleMagicLink(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const email = String(new FormData(e.currentTarget).get("email") ?? "");

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError("Could not send the link. Please try again.");
        setIsPending(false);
        return;
      }

      // The route deliberately answers the same way whether or not the address
      // has an account, so this screen cannot be used to discover who is
      // registered. Show the confirmation either way.
      setSentTo(email);
    } catch {
      setError("Could not reach the server. Please try again.");
    }

    setIsPending(false);
  }

  if (sentTo) {
    return (
      <Card className="min-w-520">
        <CardDivider className="mb-20" />
        <h1 className="mb-16">Check your email</h1>
        <p className="text-gray-2 mb-8">
          If an account exists for <strong>{sentTo}</strong>, a sign-in link is
          on its way. The link expires in 15 minutes and can only be used once.
        </p>
        <Button
          variant="ghost"
          type="button"
          className="w-full"
          onClick={() => {
            setSentTo(null);
            switchMode("password");
          }}
        >
          Back to sign in
        </Button>
      </Card>
    );
  }

  return (
    <Card className="min-w-520">
      <CardDivider className="mb-20" />

      <h1 className="mb-32">Sign in</h1>

      <Form onSubmit={handleSubmit} noValidate>
        <FormField
          name="email"
          validate={(v) => {
            if (!v) return "Email is required.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v as string))
              return "Enter a valid email address.";
            return null;
          }}
        >
          <FormLabel>Email</FormLabel>
          <FormInput
            type="email"
            name="email"
            placeholder="you@email.com"
            autoComplete="email"
            disabled={isPending}
          />
          <FormError />
        </FormField>

        {mode === "password" && (
          <FormField
            name="password"
            validate={(v) => (!v ? "Password is required." : null)}
          >
            <div className="flex items-center justify-between">
              <FormLabel>Password</FormLabel>
              <a href="#" tabIndex={-1}>
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <FormInput
                type={showPassword ? "text" : "password"}
                name="password"
                className="pr-44"
                autoComplete="current-password"
                disabled={isPending}
              />
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-6 -translate-y-1/2"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            </div>
            <FormError />
          </FormField>
        )}

        {error && (
          <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button
          variant="high-contrast"
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending
            ? mode === "magic"
              ? "Sending…"
              : "Signing in…"
            : mode === "magic"
              ? "Email me a sign-in link"
              : "Sign In"}
        </Button>

        <Button
          variant="ghost"
          type="button"
          className="w-full"
          disabled={isPending}
          onClick={() => switchMode(mode === "magic" ? "password" : "magic")}
        >
          {mode === "magic"
            ? "Use a password instead"
            : "Email me a sign-in link instead"}
        </Button>
      </Form>

      <div className="my-16 flex items-center gap-8">
        <CardDivider className="flex-1" />
        <span>or</span>
        <CardDivider className="flex-1" />
      </div>

      <Button className="w-full" type="button">
        Continue with Google
      </Button>
    </Card>
  );
}
