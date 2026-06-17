import { ComponentPropsWithoutRef, ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'

interface CardProps extends ComponentPropsWithoutRef<'div'> {
  icon?: ReactNode
  title: string
  description: string
  href?: string
}

export function Card({
  icon,
  title,
  description,
  className,
  href,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-start rounded-lg bg-blue-50 px-6 py-8',
        className,
      )}
      {...props}
    >
      {icon && <div className='mb-6'>{icon}</div>}
      <h3 className='mb-2 font-sans text-xl'>{title}</h3>
      <p className='font-serif text-base'>{description}</p>
      {href && (
        <Link
          href={href}
          className='mt-auto pt-4 font-mono text-sm hover:underline'
        >
          Learn more &rarr;
        </Link>
      )}
    </div>
  )
}
