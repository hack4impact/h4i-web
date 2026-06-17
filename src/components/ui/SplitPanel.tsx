import Link from 'next/link'

import { TEXT_CLASS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SplitPanelSide {
  label: string
  heading: string
  description: string
  linkText: string
  linkHref: string
  linkArrow?: string
  color?: string
}

interface SplitPanelProps {
  left: SplitPanelSide
  right: SplitPanelSide
}

function Side({ side, border }: { side: SplitPanelSide; border?: string }) {
  const color = side.color ?? 'gray'
  return (
    <div className={cn('flex grow basis-0 flex-col gap-4', border)}>
      <p className={cn('label', TEXT_CLASS[color])}>{side.label}</p>
      <div className='flex flex-col gap-2.5'>
        <h2 className='heading-card leading-8'>{side.heading}</h2>
        <p className='text-gray-3 font-sans text-sm leading-[22px]'>
          {side.description}
        </p>
      </div>
      <Link href={side.linkHref} className='flex items-center gap-1.5'>
        <span
          className={cn('font-sans text-sm font-medium', TEXT_CLASS[color])}
        >
          {side.linkText}
        </span>
        {side.linkArrow && (
          <span className={cn('font-sans text-sm', TEXT_CLASS[color])}>
            {side.linkArrow}
          </span>
        )}
      </Link>
    </div>
  )
}

export function SplitPanel({ left, right }: SplitPanelProps) {
  return (
    <div className='page-section-sm border-separator border-b'>
      <div className='flex flex-col md:flex-row'>
        <Side
          side={left}
          border='border-separator border-b pb-8 md:border-b-0 md:border-r md:pb-8 md:pr-10 md:pt-8'
        />
        <Side side={right} border='pt-8 md:pl-10 md:pt-8 md:pb-8' />
      </div>
    </div>
  )
}
