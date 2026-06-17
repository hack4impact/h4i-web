'use client'

import { useState } from 'react'

import { Combobox as BaseCombobox } from '@base-ui/react/combobox'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ComboboxProps {
  id?: string
  name?: string
  options: string[]
  placeholder?: string
  required?: boolean
  allowNew?: boolean
  onAddNew?: (value: string) => void | Promise<void>
}

export function Combobox({
  id,
  name,
  options,
  placeholder,
  required,
  allowNew = false,
  onAddNew,
}: ComboboxProps) {
  const [localItems, setLocalItems] = useState<string[]>(options)
  const [query, setQuery] = useState('')
  const [value, setValue] = useState<string | null>(null)

  const isSearching = query.trim() !== '' && query !== value
  const filtered = isSearching
    ? localItems.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase()),
      )
    : localItems

  const showPortal = filtered.length > 0 || Boolean(query.trim())

  function handleValueChange(v: string | null) {
    setValue(v)
    if (
      allowNew &&
      v &&
      !localItems.some((item) => item.toLowerCase() === v.toLowerCase())
    ) {
      setLocalItems((prev) => [...prev, v])
      onAddNew?.(v)
    }
  }

  return (
    <BaseCombobox.Root
      value={value}
      onInputValueChange={setQuery}
      onValueChange={handleValueChange}
    >
      <div className='relative'>
        <BaseCombobox.Input
          id={id}
          name={name}
          placeholder={placeholder}
          required={required}
          className={cn('input-auth', value && 'pr-9')}
          autoComplete='off'
        />
        <BaseCombobox.Clear
          aria-label='Clear'
          className='text-gray-4 hover:text-gray-2 absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded transition-colors'
        >
          <X size={10} />
        </BaseCombobox.Clear>
      </div>
      {showPortal && (
        <BaseCombobox.Portal>
          <BaseCombobox.Positioner
            sideOffset={6}
            align='start'
            positionMethod='fixed'
            className='z-50'
          >
            <BaseCombobox.Popup className='select-popup select-popup-panel min-w-[var(--anchor-width)]'>
              <BaseCombobox.List className='max-h-[220px] overflow-y-auto py-1'>
                {filtered.map((item) => (
                  <BaseCombobox.Item
                    key={item}
                    value={item}
                    className='select-item'
                  >
                    {item}
                  </BaseCombobox.Item>
                ))}
                {filtered.length === 0 &&
                  query.trim() &&
                  (allowNew ? (
                    <BaseCombobox.Item
                      value={query.trim()}
                      className='select-item'
                    >
                      Add &ldquo;{query.trim()}&rdquo;
                    </BaseCombobox.Item>
                  ) : (
                    <p className='select-item cursor-default opacity-50'>
                      No results
                    </p>
                  ))}
              </BaseCombobox.List>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      )}
    </BaseCombobox.Root>
  )
}
