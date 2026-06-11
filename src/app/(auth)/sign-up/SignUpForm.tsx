"use client";

import { useActionState, useState } from "react";
import { Form } from "@base-ui/react/form";
import { credentialsSignUp } from "@/actions/authn";
import { type SelectOption } from "@/components/ui/FilterSelect";
import { AuthHeader } from "../AuthHeader";
import {
  TextField,
  SelectField,
  ComboboxField,
  SectionDivider,
} from "@/components/ui/FormFields";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Chapter {
  id: string;
  university: string;
}

interface SignUpFormProps {
  chapters: Chapter[];
  majorOptions: string[];
  employerOptions: string[];
  genderOptions: SelectOption[];
  raceOptions: SelectOption[];
}

const Y = new Date().getFullYear();
const descRange = (lo: number, hi: number) =>
  Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);

const JOIN_YEAR_STRINGS = descRange(2014, Y).map(String);
const GRAD_YEAR_STRINGS = descRange(2010, Y + 8).map(String);
const BIRTH_YEAR_STRINGS = descRange(1940, Y - 14).map(String);

async function action(
  _: { error: string } | null,
  fd: FormData
): Promise<{ error: string } | null> {
  return (await credentialsSignUp(fd)) ?? null;
}

export default function SignUpForm({
  chapters,
  majorOptions,
  employerOptions,
  genderOptions,
  raceOptions,
}: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [volunteerType, setVolunteerType] = useState<
    "STUDENT" | "PROFESSIONAL"
  >("STUDENT");

  const chapterOptions = chapters.map((c) => ({
    value: c.id,
    label: c.university,
  }));

  return (
    <div className="w-full max-w-[460px] px-4">
      <AuthHeader
        title="Volunteer Registration"
        subtitle="Create your Hack4Impact account"
      />

      <Form action={formAction} className="flex flex-col gap-4">
        {/* ── Volunteer type ────────────────────────────────────── */}
        <input type="hidden" name="volunteerType" value={volunteerType} />
        <div className="grid grid-cols-2 gap-2">
          {(["STUDENT", "PROFESSIONAL"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setVolunteerType(type)}
              className={cn(
                "rounded-[var(--radius-6)] border px-3.5 py-2.5 font-sans text-sm transition-colors",
                volunteerType === type
                  ? "border-blue-400 bg-blue-500/10 text-blue-400"
                  : "border-separator text-gray-3 hover:border-gray-3"
              )}
            >
              {type === "STUDENT" ? "Student" : "Professional"}
            </button>
          ))}
        </div>

        {/* ── Your Information ─────────────────────────────────── */}
        <SectionDivider label="Your Information" />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="First name"
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Jane"
            required
          />
          <TextField
            label="Last name"
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Smith"
            required
          />
        </div>

        <TextField
          label="Email address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          hint="Personal email only — not a .edu address"
        />

        <TextField
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          required
        />

        {chapterOptions.length > 0 && (
          <SelectField
            label="Chapter"
            name="chapterId"
            options={chapterOptions}
            placeholder="Select your chapter…"
            searchable
            required
          />
        )}

        <ComboboxField
          label="Year you started volunteering"
          id="startYear"
          name="startYear"
          options={JOIN_YEAR_STRINGS}
          placeholder="e.g. 2018"
          required
        />

        {/* Student-specific fields */}
        {volunteerType === "STUDENT" && (
          <div className="grid grid-cols-2 gap-3">
            <ComboboxField
              label="Graduation year"
              id="graduationYear"
              name="graduationYear"
              options={GRAD_YEAR_STRINGS}
              placeholder="e.g. 2026"
              optional
            />
            <ComboboxField
              label="Major"
              id="major"
              name="major"
              options={majorOptions}
              placeholder="e.g. Computer Science"
              optional
              allowNew
              persistField="major"
            />
          </div>
        )}

        {/* Professional-specific fields */}
        {volunteerType === "PROFESSIONAL" && (
          <ComboboxField
            label="Employer"
            id="employer"
            name="employer"
            options={employerOptions}
            placeholder="Company or organization"
            optional
            allowNew
            persistField="employer"
          />
        )}

        {/* ── Demographic Information ───────────────────────────── */}
        <SectionDivider label="Demographic Information" />

        <div className="border-separator/50 bg-panel/40 rounded-xl border px-4 py-3.5">
          <p className="text-gray-3 font-sans text-[12px] leading-relaxed">
            The following is collected voluntarily to help us understand and
            improve diversity across our volunteer community. It will never be
            shared with third parties or used to evaluate your participation.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ComboboxField
            label="Birth year"
            id="birthYear"
            name="birthYear"
            options={BIRTH_YEAR_STRINGS}
            placeholder="e.g. 1998"
            optional
          />
          <SelectField
            label="Gender"
            name="gender"
            options={genderOptions}
            placeholder="Select…"
            optional
          />
        </div>

        <SelectField
          label="Race & ethnicity"
          name="raceEthnicity"
          options={raceOptions}
          placeholder="Select…"
          searchable
          optional
        />

        {state?.error && (
          <p className="label-xs -mt-1 text-orange-500">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-2 w-full">
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </Form>

      <p className="label-xs text-gray-3 mt-6 mb-4 text-center">
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
