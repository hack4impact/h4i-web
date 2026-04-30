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
import { credentialsSignUp } from "@/actions/authn";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await credentialsSignUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card className="min-w-400">
      <h1 className="mb-32">Sign Up</h1>

      <Form onSubmit={handleSubmit} noValidate>
        <div className="flex gap-12">
          <FormField
            name="firstName"
            validate={(v) => (!v ? "First name is required." : null)}
            className="flex-1"
          >
            <FormLabel>First Name</FormLabel>
            <FormInput
              name="firstName"
              className="bg-root"
              placeholder="Jane"
              autoComplete="given-name"
              disabled={isPending}
            />
            <FormError />
          </FormField>

          <FormField
            name="lastName"
            validate={(v) => (!v ? "Last name is required." : null)}
            className="flex-1"
          >
            <FormLabel>Last Name</FormLabel>
            <FormInput
              name="lastName"
              className="bg-root"
              placeholder="Doe"
              autoComplete="family-name"
              disabled={isPending}
            />
            <FormError />
          </FormField>
        </div>

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
            className="bg-root"
            placeholder="you@email.com"
            autoComplete="email"
            disabled={isPending}
          />
          <FormError />
        </FormField>

        <FormField
          name="password"
          validate={(v) => {
            if (!v) return "Password is required.";
            if ((v as string).length < 8)
              return "Password must be at least 8 characters.";
            return null;
          }}
        >
          <FormLabel>Password</FormLabel>
          <div className="relative">
            <FormInput
              type={showPassword ? "text" : "password"}
              name="password"
              className="bg-root pr-44"
              autoComplete="new-password"
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          variant="high-contrast"
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "Signing up…" : "Sign Up"}
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

      <p className="mt-16 text-center text-sm">
        Already have an account?{" "}
        <a href="/sign-in" className="font-medium">
          Sign in
        </a>
      </p>
    </Card>
  );
}
