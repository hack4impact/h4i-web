import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { type SelectOption } from '@/components/ui/Select'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildFilterOptions<T>(
  items: T[],
  getKey: (item: T) => string | string[] | null | undefined,
  compare?: (a: string, b: string) => number,
): SelectOption[] {
  const seen = new Set<string>()
  let hasNone = false
  for (const item of items) {
    const key = getKey(item)
    if (!key || (Array.isArray(key) && key.length === 0)) hasNone = true
    else if (Array.isArray(key)) for (const k of key) seen.add(k)
    else seen.add(key)
  }
  return [
    { value: 'all', label: 'All' },
    ...Array.from(seen)
      .sort(compare)
      .map((s) => ({ value: s, label: s })),
    ...(hasNone ? [{ value: '__none__', label: 'None' }] : []),
  ]
}

export function buildContentfulImageUrl(
  baseUrl: string,
  options: {
    w?: number
    h?: number
    q?: number
  },
) {
  const url = new URL(baseUrl)
  if (options.w) url.searchParams.set('w', options.w.toString())
  if (options.h) url.searchParams.set('h', options.h.toString())
  if (options.q) url.searchParams.set('q', options.q.toString())
  url.searchParams.set('fm', 'webp') // Always request WebP format
  return url.toString()
}
