"use client";

import { useState, useTransition } from "react";
import { Card, CardDivider } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormField,
  FormLabel,
  FormInput,
  FormError,
} from "@/components/ui/Form";
import { credentialsSignIn } from "@/actions/auth";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await credentialsSignIn(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card className="min-w-520">
      <CardDivider className="mb-20" />

      <h1 className="mb-32">Sign in</h1>

      <Form onSubmit={handleSubmit} noValidate className="flex flex-col gap-12">
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
            className="h-32 pr-64"
            type="email"
            name="email"
            placeholder="you@email.com"
            autoComplete="email"
            disabled={isPending}
          />
          <FormError />
        </FormField>

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
              className="h-32 pr-64"
              autoComplete="current-password"
              disabled={isPending}
            />
            <Button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-1 -translate-y-1/2 px-8 text-[11px]"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
          <FormError />
        </FormField>

        {error && <p>{error}</p>}

        <Button type="submit" className="mt-4 w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign In"}
        </Button>
      </Form>

      <div className="my-16 flex items-center gap-3">
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
