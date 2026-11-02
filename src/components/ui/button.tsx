"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-300 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-[#BFA783]/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#BFA783] text-[#0A1115] font-semibold shadow-[0_2px_12px_rgba(191,167,131,0.25)] hover:bg-[#D5C2A4] hover:shadow-[0_4px_18px_rgba(191,167,131,0.35)]",
        outline:
          "border border-[#695C49]/50 bg-transparent text-[#E9DDC9] hover:bg-[#172127] hover:border-[#BFA783]/70 hover:text-[#F5F3EF]",
        secondary:
          "bg-[#172127] text-[#F5F3EF] border border-[#695C49]/30 hover:bg-[#1D292F] hover:border-[#695C49]/60",
        ghost:
          "text-[#A6ACAF] hover:text-[#F5F3EF] hover:bg-[#172127]",
        destructive:
          "bg-[#8B2E2E]/20 text-[#F5F3EF] border border-[#8B2E2E]/40 hover:bg-[#8B2E2E]/30 focus-visible:border-[#8B2E2E]",
        link: "text-[#BFA783] underline-offset-4 hover:underline hover:text-[#E9DDC9]",
        premium:
          "bg-gradient-to-r from-[#BFA783] via-[#D5C2A4] to-[#BFA783] text-[#0A1115] font-semibold border border-[#E9DDC9]/30 shadow-[0_2px_16px_rgba(191,167,131,0.3)] hover:brightness-105 hover:shadow-[0_4px_22px_rgba(191,167,131,0.4)]",
        glass:
          "bg-[#172127]/70 backdrop-blur-xl border border-[#695C49]/30 text-[#F5F3EF] hover:bg-[#1D292F]/80 hover:border-[#BFA783]/40",
      },
      size: {
        default: "h-10 gap-2 px-6",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs",
        sm: "h-8 gap-1.5 rounded-md px-3.5 text-xs font-semibold uppercase tracking-wider",
        lg: "h-12 gap-2.5 px-8 text-sm font-semibold tracking-wide",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
