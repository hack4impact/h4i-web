'use client'

import { useState } from 'react'

import { Select as BaseSelect } from '@base-ui/react/select'
import { ChevronDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export function SelectPopup({
  options,
  searchable,
  align = 'start',
  allowNew,
}: {
  options: SelectOption[]
  searchable?: boolean
  align?: 'start' | 'end'
  allowNew?: boolean
}) {
  const [query, setQuery] = useState('')
  const visible =
    searchable && query.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase()),
        )
      : options

  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        sideOffset={6}
        align={align}
        alignItemWithTrigger={false}
        positionMethod='fixed'
        className='z-50'
      >
        <BaseSelect.Popup className='select-popup select-popup-panel min-w-[var(--anchor-width)]'>
          {searchable && (
            <div className='px-2 pt-2'>
              <input
                autoFocus
                type='text'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    ![
                      'ArrowUp',
                      'ArrowDown',
                      'Enter',
                      'Escape',
                      'Tab',
                    ].includes(e.key)
                  ) {
                    e.stopPropagation()
                  }
                }}
                placeholder='Search…'
                className='select-search'
              />
            </div>
          )}
          <div className='max-h-[220px] overflow-y-auto py-1'>
            {visible.length > 0 ? (
              visible.map((opt) => (
                <BaseSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className='select-item'
                >
                  <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))
            ) : allowNew && query.trim() ? (
              <BaseSelect.Item value={query.trim()} className='select-item'>
                <BaseSelect.ItemText>
                  Add &ldquo;{query.trim()}&rdquo;
                </BaseSelect.ItemText>
              </BaseSelect.Item>
            ) : (
              <p className='select-item cursor-default opacity-50'>
                No results
              </p>
            )}
          </div>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  )
}

export interface SelectProps {
  name: string
  options: SelectOption[]
  placeholder?: string
  align?: 'start' | 'end'
  searchable?: boolean
  required?: boolean
  disabled?: boolean
  allowNew?: boolean
}

export function Select({
  name,
  options,
  placeholder = 'Select…',
  align = 'start',
  searchable,
  required,
  disabled,
  allowNew,
}: SelectProps) {
  const [localOptions, setLocalOptions] = useState(options)
  const [value, setValue] = useState<string | null>(null)

  function handleValueChange(v: string | null) {
    setValue(v)
    if (allowNew && v && !localOptions.some((o) => o.value === v)) {
      setLocalOptions((prev) => [...prev, { value: v, label: v }])
    }
  }

  return (
    <BaseSelect.Root
      name={name}
      value={value}
      required={required}
      disabled={disabled}
      onValueChange={handleValueChange}
    >
      <BaseSelect.Trigger
        className={cn(
          'input-auth flex w-full items-center gap-2 text-left',
          '[&_[data-placeholder]]:text-gray-4',
        )}
      >
        <BaseSelect.Value placeholder={placeholder} className='flex-1 truncate'>
          {(v: string | null) =>
            v ? (localOptions.find((o) => o.value === v)?.label ?? v) : null
          }
        </BaseSelect.Value>
        {value && (
          <div
            role='button'
            aria-label='Clear'
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              setValue(null)
            }}
            className='text-gray-4 hover:text-gray-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded transition-colors'
          >
            <X size={10} />
          </div>
        )}
        <BaseSelect.Icon className='text-gray-3 shrink-0'>
          <ChevronDown size={10} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <SelectPopup
        options={localOptions}
        align={align}
        searchable={searchable}
        allowNew={allowNew}
      />
    </BaseSelect.Root>
  )
}
