'use client'

import { useState } from 'react'

import { Field } from '@base-ui/react/field'
import { Input } from '@base-ui/react/input'
import { X } from 'lucide-react'

import { Combobox } from '@/components/ui/Combobox'
import { Select, type SelectOption } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

export type { SelectOption }

const errorClass = 'label-xs text-orange-500 mt-1'

function FieldLabel({
  children,
  required,
  optional,
}: {
  children: React.ReactNode
  required?: boolean
  optional?: boolean
}) {
  return (
    <Field.Label className='label-xs text-gray-2 mb-1.5 flex items-baseline gap-1.5'>
      {children}
      {required && <span className='text-blue-400'>*</span>}
      {optional && <span className='text-gray-4'>(optional)</span>}
    </Field.Label>
  )
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
  validate,
}: {
  label: string
  id?: string
  name: string
  type: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
  optional?: boolean
  hint?: string
  validate?: (value: unknown) => string | string[] | null
}) {
  const [value, setValue] = useState('')
  const showClear = Boolean(value) && type !== 'password'

  return (
    <Field.Root name={name} validate={validate}>
      <FieldLabel required={required} optional={optional}>
        {label}
      </FieldLabel>
      <div className='relative'>
        <Input
          id={id ?? name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn('input-auth', showClear && 'pr-9')}
        />
        {showClear && (
          <button
            type='button'
            aria-label='Clear'
            onClick={() => setValue('')}
            className='text-gray-4 hover:text-gray-2 absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded transition-colors'
          >
            <X size={10} />
          </button>
        )}
      </div>
      {hint && <p className='label-xs text-gray-4 mt-1'>{hint}</p>}
      <Field.Error match='valueMissing' className={errorClass}>
        Required
      </Field.Error>
      {type === 'email' && (
        <Field.Error match='typeMismatch' className={errorClass}>
          Enter a valid email address
        </Field.Error>
      )}
      <Field.Error match='customError' className={errorClass} />
    </Field.Root>
  )
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
  label: string
  name: string
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  required?: boolean
  optional?: boolean
}) {
  return (
    <Field.Root name={name}>
      <FieldLabel required={required} optional={optional}>
        {label}
      </FieldLabel>
      <Select
        name={name}
        options={options}
        placeholder={placeholder}
        searchable={searchable}
        required={required}
      />
      <Field.Error match='valueMissing' className={errorClass}>
        Required
      </Field.Error>
    </Field.Root>
  )
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
  onAddNew,
}: {
  label: string
  id?: string
  name: string
  options: string[]
  placeholder?: string
  optional?: boolean
  required?: boolean
  allowNew?: boolean
  onAddNew?: (value: string) => void | Promise<void>
}) {
  return (
    <Field.Root name={name}>
      <FieldLabel required={required} optional={optional}>
        {label}
      </FieldLabel>
      <Combobox
        id={id ?? name}
        name={name}
        options={options}
        placeholder={placeholder}
        required={required}
        allowNew={allowNew}
        onAddNew={onAddNew}
      />
      <Field.Error match='valueMissing' className={errorClass}>
        Required
      </Field.Error>
    </Field.Root>
  )
}
