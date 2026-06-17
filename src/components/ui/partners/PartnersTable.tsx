'use client'

import { useMemo, useState } from 'react'

import type { Partner } from '@/lib/types/partner'
import { buildFilterOptions } from '@/lib/utils'

import { FilterBar } from '../FilterBar'
import { FilteredGrid } from '../FilteredGrid'
import { PartnerCard } from './PartnerCard'

type Sort = 'name-asc' | 'name-desc' | 'projects-desc'

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'A–Z' },
  { value: 'name-desc', label: 'Z–A' },
  { value: 'projects-desc', label: 'Most projects' },
]

interface PartnersTableProps {
  partners: Partner[]
}

export function PartnersTable({ partners }: PartnersTableProps) {
  const [focusArea, setFocusArea] = useState('all')
  const [orgType, setOrgType] = useState('all')
  const [sort, setSort] = useState<Sort>('name-asc')

  const focusAreaOptions = useMemo(
    () => buildFilterOptions(partners, (p) => p.subjects ?? null),
    [partners],
  )

  const orgTypeOptions = useMemo(
    () => buildFilterOptions(partners, (p) => p.organizationTypes ?? null),
    [partners],
  )

  const filtered = useMemo(() => {
    let list = [...partners]
    if (focusArea === '__none__') list = list.filter((p) => !p.subjects?.length)
    else if (focusArea !== 'all')
      list = list.filter((p) => p.subjects?.includes(focusArea))
    if (orgType === '__none__')
      list = list.filter((p) => !p.organizationTypes?.length)
    else if (orgType !== 'all')
      list = list.filter((p) => p.organizationTypes?.includes(orgType))

    list.sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name)
      if (sort === 'name-desc') return b.name.localeCompare(a.name)
      const bCount = b.projectCount ?? -1
      const aCount = a.projectCount ?? -1
      return bCount !== aCount ? bCount - aCount : a.name.localeCompare(b.name)
    })

    return list
  }, [partners, focusArea, orgType, sort])

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <FilterBar
        filters={[
          {
            label: 'Focus Area',
            value: focusArea,
            onValueChange: setFocusArea,
            options: focusAreaOptions,
          },
          {
            label: 'Org Type',
            value: orgType,
            onValueChange: setOrgType,
            options: orgTypeOptions,
          },
        ]}
        sort={{
          label: 'Sort',
          value: sort,
          onValueChange: (v) => setSort(v as Sort),
          options: SORT_OPTIONS,
        }}
      />

      <FilteredGrid
        items={filtered}
        filterKey={`${focusArea}|${orgType}|${sort}`}
        gridClassName='grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
        emptyMessage='No partners match the selected filters.'
        renderItem={(partner) => <PartnerCard partner={partner} />}
        scrollable
        staggerDelay={0.03}
      />
    </div>
  )
}
