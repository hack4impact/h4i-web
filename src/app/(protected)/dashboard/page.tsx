"use client";

import { PageHeader } from "@/components/ui/PageHeader";

import { useState } from "react";
import Image from "next/image";

const steps = ["Email", "Name", "School", "Role", "Uploads"];

export default function DashboardPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex justify-center border-b border-gray-200 py-8">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Image src="/logo.svg" alt="Hack for Impact" width={40} height={40} />

          {/* Title */}
          <div className="text-left text-2xl leading-7 font-extrabold tracking-wide text-black">
            HACK FOR
            <br />
            <br />
            <br />
            IMPACT
          </div>
        </div>
      </header>

      {/* Step circles + step circle numbers */}
      <section className="mx-auto mt-6 flex w-full max-w-5xl items-start px-8">
        {steps.map((step, index) => {
          const active = index === currentStep;
          const completed = index < currentStep;

          return (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div className="relative flex w-full items-center justify-center">
                {index !== 0 && (
                  <div
                    className={`absolute top-1/2 right-1/2 left-0 h-px -translate-y-1/2 ${
                      completed || active ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}

                {index !== steps.length - 1 && (
                  <div
                    className={`absolute top-1/2 right-0 left-1/2 h-px -translate-y-1/2 ${
                      completed ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}

                {/* Step circles */}
                <div
                  className={`relative z-10 flex h-23 w-23 items-center justify-center rounded-full text-sm font-semibold ${
                    active || completed
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Step circle numbers */}
              <p
                className={`mt-2 text-center text-xs ${
                  active ? "font-medium text-blue-600" : "text-gray-500"
                }`}
              >
                {step}
              </p>
            </div>
          );
        })}
      </section>

      {/* Page content */}
      <section className="flex min-h-[460px] items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-center text-4xl font-semibold text-gray-800">
            {steps[currentStep]}
          </h2>

          <label className="mb-2 block text-sm text-gray-700">
            {currentStep === 0
              ? "What's your email?"
              : `Dummy content for ${steps[currentStep]}.`}{" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            placeholder={steps[currentStep]}
            className="w-full rounded-md border border-gray-400 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
        </div>
      </section>

      {/* Buttons */}
      <section className="flex justify-center gap-40 pb-16">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
          disabled={currentStep === 0}
          className="rounded-md border border-gray-300 px-5 py-2 text-sm text-gray-700 disabled:opacity-40"
        >
          ← Back
        </button>

        <button
          onClick={() =>
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
          }
          disabled={currentStep === steps.length - 1}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm text-white disabled:opacity-40"
        >
          Next →
        </button>
      </section>
    </main>
  );
}
