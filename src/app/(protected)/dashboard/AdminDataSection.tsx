'use client'

import { useState } from 'react'

import { Tabs } from '@base-ui/react'

import { DataTable } from '@/components/ui/DataTable'
import { cn } from '@/lib/utils'

import {
  ACCOUNT_COLUMNS,
  OPTION_COLUMNS,
  USER_COLUMNS,
  type AccountRow,
  type OptionRow,
  type UserRow,
} from './columns'

const TABS = ['Users', 'Accounts', 'Options'] as const
type TabName = (typeof TABS)[number]

export function AdminDataSection({
  users,
  accounts,
  options,
}: {
  users: UserRow[]
  accounts: AccountRow[]
  options: OptionRow[]
}) {
  const [active, setActive] = useState<TabName>('Users')

  const counts: Record<TabName, number> = {
    Users: users.length,
    Accounts: accounts.length,
    Options: options.length,
  }

  return (
    <div className='mt-8 flex flex-1 flex-col overflow-hidden'>
      <h2 className='label text-gray-2 mb-3'>Database</h2>
      <div className='border-separator bg-panel flex flex-1 flex-col overflow-hidden rounded-xl border'>
        <Tabs.Root
          className='flex flex-1 flex-col overflow-hidden'
          value={active}
          onValueChange={(val) => setActive(val as TabName)}
        >
          <Tabs.List className='border-separator flex border-b px-4 pt-1'>
            {TABS.map((tab) => (
              <Tabs.Tab
                key={tab}
                value={tab}
                className={cn(
                  '-mb-px shrink-0 cursor-pointer border-b-2 px-4 py-2.5 font-sans text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
                  active === tab
                    ? 'text-inverse border-blue-500 font-medium'
                    : 'text-gray-3 hover:text-inverse border-transparent',
                )}
              >
                {tab}
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-[10px]',
                    active === tab
                      ? 'bg-panel-highlight-1 text-gray-2'
                      : 'text-gray-4',
                  )}
                >
                  {counts[tab]}
                </span>
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value='Users' className='flex-1 overflow-hidden p-0'>
            <DataTable
              columns={USER_COLUMNS}
              data={users}
              emptyMessage='No users found.'
            />
          </Tabs.Panel>
          <Tabs.Panel value='Accounts' className='flex-1 overflow-hidden p-0'>
            <DataTable
              columns={ACCOUNT_COLUMNS}
              data={accounts}
              emptyMessage='No accounts found.'
            />
          </Tabs.Panel>
          <Tabs.Panel value='Options' className='flex-1 overflow-hidden p-0'>
            <DataTable
              columns={OPTION_COLUMNS}
              data={options}
              emptyMessage='No options found.'
            />
          </Tabs.Panel>
        </Tabs.Root>
      </div>
    </div>
  )
}
