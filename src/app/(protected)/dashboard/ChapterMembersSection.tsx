'use client'

import { DataTable } from '@/components/ui/DataTable'

import { USER_COLUMNS, type UserRow } from './columns'

export function ChapterMembersSection({ users }: { users: UserRow[] }) {
  return (
    <DataTable
      columns={USER_COLUMNS}
      data={users}
      emptyMessage='No volunteers found for this chapter.'
    />
  )
}
