"use client";

import { Field } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import { Form as BaseForm } from "@base-ui/react/form";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type WithStringClassName<T> = Omit<T, "className"> & { className?: string };

// Form

export function Form({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof BaseForm>>) {
  return (
    <BaseForm className={cn("flex flex-col gap-4", className)} {...props} />
  );
}

// Field

export function FormField({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Root>>) {
  return (
    <Field.Root className={cn("flex flex-col gap-1.5", className)} {...props} />
  );
}

export function FormLabel({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Label>>) {
  return (
    <Field.Label
      className={cn(
        "text-text-meta text-sm",
        className
      )}
      {...props}
    />
  );
}

export function FormInput({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof BaseInput>>) {
  return (
    <BaseInput
      className={cn(
        "border-border bg-card text-text-primary placeholder:text-text-disabled h-8 w-full rounded-sm border px-3 text-sm",
        "focus:border-brand focus:ring-brand-ring focus:ring-2 focus:outline-none",
        "data-invalid:border-red-400 data-invalid:ring-2 data-invalid:ring-red-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function FormError({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Error>>) {
  return (
    <Field.Error className={cn("text-xs text-red-500", className)} {...props} />
  );
}
