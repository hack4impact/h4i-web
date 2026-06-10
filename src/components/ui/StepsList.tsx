"use client";

import type { ProcessStep } from "@/lib/types/contentful";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { TEXT_CLASS } from "@/lib/constants";

const containerVariants = staggerContainer(0.12);
const stepVariants = fadeInUp(0.5);

interface StepsListProps {
  steps: ProcessStep[];
  numbered?: boolean;
  label?: string;
  title?: string;
  color?: string;
}

export function StepsList({
  steps,
  numbered = true,
  label,
  title,
  color = "blue",
}: StepsListProps) {
  return (
    <motion.div
      className="divide-separator border-separator flex flex-col divide-y border-b"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {(label || title) && (
        <div className="flex flex-col gap-2 pt-2 pb-8">
          {label && <p className={cn("label", TEXT_CLASS[color])}>{label}</p>}
          {title && <h2 className="heading-display">{title}</h2>}
        </div>
      )}
      {steps.map((step, i) => (
        <motion.div
          key={step.name}
          className="flex items-start py-7"
          variants={stepVariants}
        >
          {numbered && (
            <>
              <span
                className={cn(
                  "w-24 shrink-0 font-serif text-5xl leading-none font-light opacity-40",
                  TEXT_CLASS[color]
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="bg-separator mr-8 w-px shrink-0 self-stretch" />
            </>
          )}
          <div className="flex flex-col gap-1.5 pt-1">
            <h3 className="text-inverse font-sans text-base font-medium">
              {step.name}
            </h3>
            <p className="text-gray-2 font-sans text-sm leading-[1.5]">
              {step.description}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
