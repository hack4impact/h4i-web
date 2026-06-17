'use client'

import { Collapsible } from '@base-ui/react/collapsible'

import { FilterSelect } from './FilterSelect'

export interface FilterConfig {
  label: string
  value: string
  onValueChange: (v: string) => void
  options: { value: string; label: string }[]
  align?: 'start' | 'end'
}

interface FilterBarProps {
  filters: FilterConfig[]
  sort: FilterConfig
}

export function FilterBar({ filters, sort }: FilterBarProps) {
  return (
    <>
      {/* Desktop */}
      <div className='border-separator hidden items-center gap-2 border-b pb-5 md:flex'>
        {filters.map((f) => (
          <FilterSelect key={f.label} {...f} />
        ))}
        <div className='ml-auto'>
          <FilterSelect {...sort} align={sort.align ?? 'end'} />
        </div>
      </div>

      {/* Mobile */}
      <div className='border-separator border-b pb-5 md:hidden'>
        <Collapsible.Root>
          <div className='flex items-center justify-between'>
            <Collapsible.Trigger className='group border-separator label-xs text-gray-2 hover:border-gray-3 flex cursor-pointer items-center gap-2 rounded-[6px] border px-3.5 py-2 transition-colors outline-none'>
              Filters
              <svg
                width='10'
                height='10'
                viewBox='0 0 12 12'
                fill='none'
                className='transition-transform duration-200 group-data-[panel-open]:rotate-180'
              >
                <path
                  d='M3 4.5L6 7.5L9 4.5'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </Collapsible.Trigger>
            <FilterSelect {...sort} align={sort.align ?? 'end'} />
          </div>
          <Collapsible.Panel className='[height:var(--collapsible-panel-height,0px)] overflow-hidden [transition:height_0.24s_cubic-bezier(0.16,1,0.3,1)]'>
            <div className='grid grid-cols-2 gap-2 pt-3'>
              {filters.map((f) => (
                <FilterSelect key={f.label} {...f} />
              ))}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      </div>
    </>
  )
}
