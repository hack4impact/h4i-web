import type { ColumnDef } from '@/components/ui/DataTable'

export type UserRow = {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  role: string
  chapterId: string | null
  volunteerType: string | null
  startYear: number | null
  employer: string | null
  birthYear: number | null
  gender: string | null
  ethnicity: string | null
  graduationYear: number | null
  major: string | null
  createdAt: Date
  updatedAt: Date
  _count: { accounts: number }
}

export type AccountRow = {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  token_type: string | null
  scope: string | null
  expires_at: number | null
  session_state: string | null
}

export type OptionRow = {
  id: string
  field: string
  value: string
  order: number
}

function truncate(s: string | null | undefined, n = 16): string {
  if (!s) return '—'
  return s.length > n ? s.slice(0, n) + '…' : s
}

function fmt(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toISOString().slice(0, 10)
}

export const USER_COLUMNS: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    meta: { muted: true },
    cell: ({ row }) => truncate(row.getValue('id'), 10),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.original.name ?? '—',
  },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'chapterId',
    header: 'Chapter ID',
    meta: { muted: true },
    cell: ({ row }) => truncate(row.original.chapterId, 10),
  },
  {
    accessorKey: 'volunteerType',
    header: 'Volunteer Type',
    cell: ({ row }) => row.original.volunteerType ?? '—',
  },
  {
    accessorKey: 'startYear',
    header: 'Start Year',
    cell: ({ row }) => row.original.startYear ?? '—',
  },
  {
    accessorKey: 'employer',
    header: 'Employer',
    cell: ({ row }) => row.original.employer ?? '—',
  },
  {
    accessorKey: 'birthYear',
    header: 'Birth Year',
    cell: ({ row }) => row.original.birthYear ?? '—',
  },
  {
    accessorKey: 'gender',
    header: 'Gender',
    cell: ({ row }) => row.original.gender ?? '—',
  },
  {
    accessorKey: 'ethnicity',
    header: 'Ethnicity',
    cell: ({ row }) => row.original.ethnicity ?? '—',
  },
  {
    accessorKey: 'graduationYear',
    header: 'Grad Year',
    cell: ({ row }) => row.original.graduationYear ?? '—',
  },
  {
    accessorKey: 'major',
    header: 'Major',
    cell: ({ row }) => row.original.major ?? '—',
  },
  {
    accessorKey: 'emailVerified',
    header: 'Email Verified',
    cell: ({ row }) => fmt(row.original.emailVerified),
  },
  {
    id: 'accounts',
    header: 'OAuth Accounts',
    cell: ({ row }) => row.original._count.accounts,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    meta: { muted: true },
    cell: ({ row }) => fmt(row.original.createdAt),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    meta: { muted: true },
    cell: ({ row }) => fmt(row.original.updatedAt),
  },
]

export const ACCOUNT_COLUMNS: ColumnDef<AccountRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    meta: { muted: true },
    cell: ({ row }) => truncate(row.getValue('id'), 10),
  },
  {
    accessorKey: 'userId',
    header: 'User ID',
    meta: { muted: true },
    cell: ({ row }) => truncate(row.getValue('userId'), 10),
  },
  { accessorKey: 'provider', header: 'Provider' },
  {
    accessorKey: 'providerAccountId',
    header: 'Provider Account ID',
    meta: { muted: true },
    cell: ({ row }) => truncate(row.getValue('providerAccountId'), 20),
  },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'token_type',
    header: 'Token Type',
    cell: ({ row }) => row.original.token_type ?? '—',
  },
  {
    accessorKey: 'scope',
    header: 'Scope',
    cell: ({ row }) => truncate(row.original.scope, 30),
  },
  {
    accessorKey: 'expires_at',
    header: 'Expires At',
    cell: ({ row }) =>
      row.original.expires_at
        ? new Date(row.original.expires_at * 1000).toISOString().slice(0, 10)
        : '—',
  },
  {
    accessorKey: 'session_state',
    header: 'Session State',
    meta: { muted: true },
    cell: ({ row }) => row.original.session_state ?? '—',
  },
]

export const OPTION_COLUMNS: ColumnDef<OptionRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    meta: { muted: true },
    cell: ({ row }) => truncate(row.getValue('id'), 10),
  },
  { accessorKey: 'field', header: 'Field' },
  { accessorKey: 'value', header: 'Value' },
  { accessorKey: 'order', header: 'Order' },
]
