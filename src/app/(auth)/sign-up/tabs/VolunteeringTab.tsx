'use client'

import { useState } from 'react'

import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'

import { addFieldOption } from '@/actions/field-options'
import {
  ComboboxField,
  SelectField,
  type SelectOption,
} from '@/components/forms/FormFields'

const Y = new Date().getFullYear()
const JOIN_YEAR_STRINGS = Array.from({ length: Y - 2014 + 1 }, (_, i) =>
  String(Y - i),
)

const TOGGLE_ITEM_CLASS =
  'rounded-[var(--radius-6)] border px-3.5 py-2.5 font-sans text-sm transition-colors ' +
  'border-separator text-gray-3 hover:border-gray-3 cursor-pointer ' +
  'data-[pressed]:border-blue-400 data-[pressed]:bg-blue-500/10 data-[pressed]:text-blue-400'

const UNAFFILIATED: SelectOption = {
  value: 'unaffiliated',
  label: 'Unaffiliated',
}

interface VolunteeringTabProps {
  chapters: SelectOption[]
  employerOptions: string[]
}

export function VolunteeringTab({
  chapters,
  employerOptions,
}: VolunteeringTabProps) {
  const [volunteerType, setVolunteerType] = useState<
    'STUDENT' | 'PROFESSIONAL'
  >('STUDENT')

  const chapterOptions =
    volunteerType === 'PROFESSIONAL' ? [UNAFFILIATED, ...chapters] : chapters

  return (
    <>
      <input type='hidden' name='volunteerType' value={volunteerType} />

      <ToggleGroup
        value={[volunteerType]}
        onValueChange={(values) => {
          const t = values[0]
          if (t === 'STUDENT' || t === 'PROFESSIONAL') setVolunteerType(t)
        }}
        className='grid grid-cols-2 gap-2'
      >
        <Toggle value='STUDENT' className={TOGGLE_ITEM_CLASS}>
          Student
        </Toggle>
        <Toggle value='PROFESSIONAL' className={TOGGLE_ITEM_CLASS}>
          Professional
        </Toggle>
      </ToggleGroup>

      {chapterOptions.length > 0 && (
        <SelectField
          label='Chapter'
          name='chapterId'
          options={chapterOptions}
          placeholder='Select your chapter…'
          searchable
          required
        />
      )}

      <ComboboxField
        label='Year you started volunteering'
        name='startYear'
        options={JOIN_YEAR_STRINGS}
        placeholder='e.g. 2018'
        required
      />

      {volunteerType === 'PROFESSIONAL' && (
        <ComboboxField
          label='Employer'
          name='employer'
          options={employerOptions}
          placeholder='Company or organization'
          optional
          allowNew
          onAddNew={(v) => addFieldOption('employer', v)}
        />
      )}
    </>
  )
}
