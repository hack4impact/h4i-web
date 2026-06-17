'use client'

import { Select as BaseSelect } from '@base-ui/react/select'
import { ChevronDown } from 'lucide-react'

import { SelectPopup, type SelectOption } from '@/components/ui/Select'

export type { SelectOption }

export interface FilterSelectProps {
  value: string
  onValueChange: (v: string) => void
  options: SelectOption[]
  label?: string
  align?: 'start' | 'end'
  searchable?: boolean
}

export function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  align = 'start',
  searchable,
}: FilterSelectProps) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(v) => onValueChange(v ?? 'all')}
    >
      <BaseSelect.Trigger className='select-trigger label-xs bg-root'>
        {label && (
          <>
            <span className='text-gray-2'>{label}</span>
            <span className='text-gray-4'>|</span>
          </>
        )}
        <BaseSelect.Value />
        <BaseSelect.Icon className='text-gray-2'>
          <ChevronDown size={10} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <SelectPopup options={options} align={align} searchable={searchable} />
    </BaseSelect.Root>
  )
}
