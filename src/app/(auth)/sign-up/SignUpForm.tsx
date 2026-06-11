"use client";

import { useActionState } from "react";
import { Form } from "@base-ui/react/form";
import { Tabs } from "@base-ui/react/tabs";
import { credentialsSignUp } from "@/actions/authn";
import { type SelectOption } from "@/components/forms/AppInputs";
import { AuthHeader } from "@/components/ui/AuthHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { AccountTab } from "./tabs/AccountTab";
import { VolunteeringTab } from "./tabs/VolunteeringTab";
import { EducationTab } from "./tabs/EducationTab";
import { BackgroundTab } from "./tabs/BackgroundTab";

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

const TABS = [
  { value: "account", label: "Account" },
  { value: "volunteering", label: "Volunteering" },
  { value: "education", label: "Education" },
  { value: "background", label: "Background" },
] as const;

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

  const chapterOptions = chapters.map((c) => ({
    value: c.id,
    label: c.university,
  }));
  const universityOptions = chapters.map((c) => c.university);

  return (
    <div className="w-full max-w-[460px] px-4">
      <AuthHeader
        title="Volunteer Registration"
        subtitle="Create your Hack4Impact account"
      />

      <Form action={formAction} className="flex flex-col gap-5">
        <Tabs.Root defaultValue="account">
          <Tabs.List className="border-separator relative mb-5 flex border-b">
            {TABS.map(({ value, label }) => (
              <Tabs.Tab
                key={value}
                value={value}
                className="label-xs text-gray-3 hover:text-gray-2 cursor-pointer px-3 py-2.5 transition-colors outline-none data-[active]:text-blue-400"
              >
                {label}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator
              className="absolute bottom-0 h-0.5 bg-blue-400"
              style={{
                left: "var(--active-tab-left)",
                width: "var(--active-tab-width)",
                transition:
                  "left 200ms cubic-bezier(0.16,1,0.3,1), width 200ms cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </Tabs.List>

          <Tabs.Panel
            value="account"
            keepMounted
            className="flex flex-col gap-4"
          >
            <AccountTab />
          </Tabs.Panel>

          <Tabs.Panel
            value="volunteering"
            keepMounted
            className="flex flex-col gap-4"
          >
            <VolunteeringTab
              chapters={chapterOptions}
              employerOptions={employerOptions}
            />
          </Tabs.Panel>

          <Tabs.Panel
            value="education"
            keepMounted
            className="flex flex-col gap-4"
          >
            <EducationTab
              universityOptions={universityOptions}
              majorOptions={majorOptions}
            />
          </Tabs.Panel>

          <Tabs.Panel
            value="background"
            keepMounted
            className="flex flex-col gap-4"
          >
            <BackgroundTab
              genderOptions={genderOptions}
              raceOptions={raceOptions}
            />
          </Tabs.Panel>
        </Tabs.Root>

        {state?.error && (
          <p className="label-xs -mt-1 text-orange-500">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
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
