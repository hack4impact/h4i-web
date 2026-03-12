import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
};

type DataTableProps<T extends Record<string, unknown>> = {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
}: DataTableProps<T>) {
  return (
    <div className="w-full">
      <table className="w-full min-w-max">
        <thead className="bg-surface sticky top-0 z-10">
          <tr className="border-divider border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-text-meta px-3 py-[7px] text-left text-xs font-normal tracking-[0.08em] whitespace-nowrap uppercase"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey ? String(row[rowKey]) : i}
              className="border-divider border-b last:border-0"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="text-text-primary px-3 py-[7px] text-sm"
                >
                  {col.render
                    ? col.render(row)
                    : String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
