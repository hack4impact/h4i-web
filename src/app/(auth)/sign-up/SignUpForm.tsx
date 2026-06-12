"use client";

import { useActionState, useRef, useState } from "react";
import { Form } from "@base-ui/react/form";
import { credentialsSignUp } from "@/actions/authn";
import { type SelectOption } from "@/components/forms/AppInputs";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AccountTab } from "./tabs/AccountTab";
import { VolunteeringTab } from "./tabs/VolunteeringTab";
import { EducationTab } from "./tabs/EducationTab";
import { BackgroundTab } from "./tabs/BackgroundTab";
import { ReviewTab } from "./tabs/ReviewTab";

interface ChapterOption {
  id: string;
  university: string;
}

interface SignUpFormProps {
  chapters: ChapterOption[];
  majorOptions: string[];
  employerOptions: string[];
  genderOptions: SelectOption[];
  raceOptions: SelectOption[];
}

const STEPS = [
  { label: "Account" },
  { label: "Volunteering" },
  { label: "Education" },
  { label: "Background" },
  { label: "Review" },
];

async function action(
  _: { error: string } | null,
  fd: FormData
): Promise<{ error: string } | null> {
  return (await credentialsSignUp(fd)) ?? null;
}

function WizardProgress({
  steps,
  current,
}: {
  steps: { label: string }[];
  current: number;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="label-xs text-gray-2 font-medium">
          {steps[current].label}
        </span>
        <span className="label-xs text-gray-4">
          {current + 1} of {steps.length}
        </span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= current ? "bg-blue-400" : "bg-separator"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function StepPanel({
  step,
  current,
  panelRef,
  children,
}: {
  step: number;
  current: number;
  panelRef?: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={panelRef}
      className={cn("flex flex-col gap-4", step !== current && "hidden")}
    >
      {children}
    </div>
  );
}

export default function SignUpForm({
  chapters,
  majorOptions,
  employerOptions,
  genderOptions,
  raceOptions,
}: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [currentStep, setCurrentStep] = useState(0);
  const [reviewData, setReviewData] = useState<Record<string, string>>({});

  const actionsRef = useRef<Form.Actions | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setPanel = (i: number) => (el: HTMLDivElement | null) => {
    panelRefs.current[i] = el;
  };

  const chapterOptions = chapters.map((c) => ({
    value: c.id,
    label: c.university,
  }));
  const universityOptions = chapters.map((c) => c.university);

  function handleNext() {
    actionsRef.current?.validate();
    const panel = panelRefs.current[currentStep];
    if (!panel) {
      setCurrentStep((s) => s + 1);
      return;
    }
    const required = Array.from(
      panel.querySelectorAll<HTMLInputElement>(
        "input[required], select[required], textarea[required]"
      )
    );
    console.log(required);
    const hasInvalid = required.some((el) => !el.checkValidity());
    if (!hasInvalid) {
      if (currentStep === STEPS.length - 2 && formRef.current) {
        const fd = new FormData(formRef.current);
        const obj: Record<string, string> = {};
        fd.forEach((v, k) => {
          obj[k] = String(v);
        });
        setReviewData(obj);
        console.log(obj);
      }
      setCurrentStep((s) => s + 1);
    }
  }

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="w-full max-w-[460px] px-4">
      <WizardProgress steps={STEPS} current={currentStep} />

      <Form
        ref={formRef}
        action={formAction}
        validationMode="onBlur"
        actionsRef={actionsRef}
        className="flex flex-col gap-5"
      >
        <StepPanel step={0} current={currentStep} panelRef={setPanel(0)}>
          <AccountTab />
        </StepPanel>

        <StepPanel step={1} current={currentStep} panelRef={setPanel(1)}>
          <VolunteeringTab
            chapters={chapterOptions}
            employerOptions={employerOptions}
          />
        </StepPanel>

        <StepPanel step={2} current={currentStep} panelRef={setPanel(2)}>
          <EducationTab
            universityOptions={universityOptions}
            majorOptions={majorOptions}
          />
        </StepPanel>

        <StepPanel step={3} current={currentStep} panelRef={setPanel(3)}>
          <BackgroundTab
            genderOptions={genderOptions}
            raceOptions={raceOptions}
          />
        </StepPanel>

        <StepPanel step={4} current={currentStep}>
          <ReviewTab data={reviewData} chapterOptions={chapterOptions} />
        </StepPanel>

        {state?.error && (
          <p className="label-xs -mt-1 text-orange-500">{state.error}</p>
        )}

        <div className="mt-1 flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="label-xs text-gray-3 hover:bg-separator hover:text-inverse -ml-2 rounded px-2 py-1 transition-colors"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}

          {!isLastStep ? (
            <Button key="continue" type="button" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={isPending}>
              {isPending ? "Creating account…" : "Create account"}
            </Button>
          )}
        </div>
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
