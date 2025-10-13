import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-110 hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/50",
        secondary:
          "border-transparent bg-blue-100 text-blue-900 hover:bg-blue-200",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/50",
        outline: "text-blue-600 border-blue-600 hover:bg-blue-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
