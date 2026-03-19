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

// Icons

function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
    <Card className="w-100">
      <div className="mb-5">
        <p className="mb-1">Hack for Impact</p>
        <p>Volunteer Platform</p>
      </div>

      <CardDivider className="mb-5" />

      <h1 className="mb-1">Sign in to your account</h1>
      <p className="mb-5">
        Admin access only. Contact your administrator if you need help.
      </p>

      <Form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
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
              className="pr-9"
              autoComplete="current-password"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <FormError />
        </FormField>

        {error && <p>{error}</p>}

        <Button type="submit" className="mt-1 w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign In"}
        </Button>
      </Form>

      <div className="my-4 flex items-center gap-3">
        <hr className="flex-1" />
        <span>or</span>
        <hr className="flex-1" />
      </div>

      <Button variant="secondary" className="w-full gap-2" type="button">
        <GoogleIcon />
        Continue with Google
      </Button>
    </Card>
  );
}
