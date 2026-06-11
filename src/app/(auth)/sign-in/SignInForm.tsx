"use client";

import { useActionState } from "react";
import { Form } from "@base-ui/react/form";
import { credentialsSignIn } from "@/actions/authn";
import { TextField } from "@/components/forms/FormFields";
import { Button } from "@/components/ui/Button";
import { AuthHeader } from "@/components/ui/AuthHeader";
import Link from "next/link";

async function action(
  _: { error: string } | null,
  fd: FormData
): Promise<{ error: string } | null> {
  return (await credentialsSignIn(fd)) ?? null;
}

export default function SignInForm() {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="w-full max-w-[360px] px-4">
      <AuthHeader title="Sign in" subtitle="to your volunteer account" />

      <Form action={formAction} className="flex flex-col gap-5">
        <TextField
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <TextField
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />

        {state?.error && (
          <p className="label-xs -mt-1 text-orange-500">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-1 w-full">
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </Form>

      <p className="label-xs text-gray-3 mt-8 text-center">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-blue-500 transition-colors hover:text-blue-600"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
