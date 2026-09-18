import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        default: 'border-gray-300 bg-gray-100 text-gray-700',
        success: 'border-green-200 bg-green-50 text-green-700',
        pending: 'border-amber-200 bg-amber-50 text-amber-700',
        danger: 'border-red-200 bg-red-50 text-red-700',
        neutral: 'border-gray-300 bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: Readonly<BadgeProps>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
