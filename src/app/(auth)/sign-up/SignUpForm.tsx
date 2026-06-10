"use client";

import { useActionState } from "react";
import { credentialsSignUp } from "@/actions/authn";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";

async function action(
  _: { error: string } | null,
  fd: FormData
): Promise<{ error: string } | null> {
  return (await credentialsSignUp(fd)) ?? null;
}

const inputClass =
  "w-full rounded-[var(--radius-6)] border border-separator bg-transparent px-3.5 py-2 font-sans text-sm text-inverse outline-none transition-colors placeholder:text-gray-4 hover:border-gray-3 focus:border-blue-400";

export default function SignUpForm() {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="border-separator bg-panel shadow-popup w-full max-w-[360px] rounded-xl border p-8">
      <Image
        src="/logo.svg"
        alt="Hack4Impact"
        width={144}
        height={22}
        className="logo-adaptive mx-auto mb-7"
      />

      <h1 className="text-inverse mb-1 text-center font-serif text-[26px] leading-[34px] font-light tracking-[-0.01em]">
        Create account
      </h1>
      <p className="label-xs text-gray-3 mb-8 text-center">
        to join as a volunteer
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="firstName"
              className="label-xs text-gray-2 mb-1.5 block"
            >
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              placeholder="Jane"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="label-xs text-gray-2 mb-1.5 block"
            >
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              placeholder="Smith"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label-xs text-gray-2 mb-1.5 block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="label-xs text-gray-2 mb-1.5 block"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        {state?.error && (
          <p className="label-xs -mt-1 text-orange-500">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-2 w-full">
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="label-xs text-gray-3 mt-6 text-center">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-blue-500 transition-colors hover:text-blue-600"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
