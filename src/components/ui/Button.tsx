'use client'

import { ComponentProps } from 'react'

import { Button as BaseButton } from '@base-ui/react/button'

import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonColor = 'blue' | 'purple' | 'pink' | 'orange' | 'green'

interface ButtonProps extends ComponentProps<typeof BaseButton> {
  variant?: ButtonVariant
  size?: ButtonSize
  color?: ButtonColor
}

const primaryStyles: Record<ButtonColor, string> = {
  blue: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
  purple: 'bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700',
  pink: 'bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700',
  orange: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700',
  green: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
}

const variantStyles: Record<Exclude<ButtonVariant, 'primary'>, string> = {
  secondary:
    'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800',
  outline:
    'border border-inverse text-inverse hover:bg-inverse hover:text-root active:bg-inverse',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[11px]',
  md: 'px-7 py-3 text-[13px]',
  lg: 'px-8 py-3.5 text-[15px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  color = 'blue',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        'inline-flex items-center justify-center rounded-md font-mono tracking-[0.02em] transition-colors disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' ? primaryStyles[color] : variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </BaseButton>
  )
}
