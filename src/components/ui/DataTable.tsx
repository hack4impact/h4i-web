'use client'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'

import { cn } from '@/lib/utils'

export type { ColumnDef }

// Augment TanStack's ColumnMeta to support a `muted` cell style
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    muted?: boolean
  }
}

const cell = 'px-3 py-2 text-left align-top'
const thCls = cn(cell, 'label-xs text-gray-3 font-medium whitespace-nowrap')
const tdCls = cn(cell, 'label-xs font-mono whitespace-nowrap')

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  emptyMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = 'No data found.',
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse'>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className='border-separator border-b'>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className={thCls}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className='border-separator hover:bg-panel-highlight-1 border-b transition-colors last:border-0'
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      tdCls,
                      cell.column.columnDef.meta?.muted
                        ? 'text-gray-4'
                        : 'text-inverse',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className='label-xs text-gray-4 px-3 py-4 text-center'
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
