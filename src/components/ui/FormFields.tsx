"use client";

import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import {
  AppCombobox,
  AppSelect,
  type SelectOption,
} from "@/components/ui/FilterSelect";

export function FieldLabel({
  children,
  optional,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <Field.Label className="label-xs text-gray-2 mb-1.5 flex items-baseline gap-1.5">
      {children}
      {optional && <span className="text-gray-4">(optional)</span>}
    </Field.Label>
  );
}

export function TextField({
  label,
  id,
  name,
  type,
  placeholder,
  autoComplete,
  required,
  optional,
  hint,
}: {
  label: string;
  id: string;
  name: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <Field.Root name={name}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        className="input-auth"
      />
      {hint && <p className="label-xs text-gray-4 mt-1">{hint}</p>}
    </Field.Root>
  );
}

export function SelectField({
  label,
  name,
  options,
  placeholder,
  searchable,
  required,
  optional,
}: {
  label: string;
  name: string;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <Field.Root name={name}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <AppSelect
        name={name}
        options={options}
        placeholder={placeholder}
        searchable={searchable}
        required={required}
      />
    </Field.Root>
  );
}

export function ComboboxField({
  label,
  id,
  name,
  options,
  placeholder,
  optional,
  required,
  allowNew,
  persistField,
}: {
  label: string;
  id: string;
  name: string;
  options: string[];
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  allowNew?: boolean;
  persistField?: string;
}) {
  return (
    <Field.Root name={name}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <AppCombobox
        id={id}
        name={name}
        options={options}
        placeholder={placeholder}
        required={required}
        allowNew={allowNew}
        persistField={persistField}
      />
    </Field.Root>
  );
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="label-xs text-gray-4 whitespace-nowrap">{label}</span>
      <div className="bg-separator h-px flex-1" />
    </div>
  );
}
