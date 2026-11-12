"use client";

import { Field } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import { Form as BaseForm } from "@base-ui/react/form";
import { cn } from "@/lib/utils";
import type { ComponentProps, ComponentPropsWithoutRef } from "react";

type WithStringClassName<T> = Omit<T, "className"> & { className?: string };

// Form

export function Form({
  className,
  ...props
}: WithStringClassName<ComponentProps<typeof BaseForm>>) {
  return (
    <BaseForm className={cn("flex flex-col gap-16", className)} {...props} />
  );
}

// Field

const controlClass = cn(
  "border-separator bg-panel w-full border px-12",
  "placeholder:text-gray-2",
  "focus:border-(--accent) focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function FormField({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Root>>) {
  return (
    <Field.Root className={cn("flex flex-col gap-6", className)} {...props} />
  );
}

export function FormLabel({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Label>>) {
  return (
    <Field.Label
      className={cn("text-gray-1 font-medium", className)}
      {...props}
    />
  );
}

export function FormInput({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof BaseInput>>) {
  return (
    <BaseInput className={cn(controlClass, "h-32", className)} {...props} />
  );
}

export function FormTextarea({
  className,
  rows = 4,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Control>> & {
  rows?: number;
}) {
  return (
    <Field.Control
      render={<textarea rows={rows} />}
      className={cn(controlClass, "resize-y py-8 leading-18", className)}
      {...props}
    />
  );
}

export function FormSelect({
  className,
  children,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Control>>) {
  return (
    <Field.Control
      render={<select>{children}</select>}
      className={cn(controlClass, "h-32", className)}
      {...props}
    />
  );
}

export function FormDescription({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Description>>) {
  return (
    <Field.Description className={cn("text-gray-3", className)} {...props} />
  );
}

export function FormError({
  className,
  ...props
}: WithStringClassName<ComponentPropsWithoutRef<typeof Field.Error>>) {
  return (
    <Field.Error
      className={cn("text-[11px] text-red-600 dark:text-red-400", className)}
      {...props}
    />
  );
}
