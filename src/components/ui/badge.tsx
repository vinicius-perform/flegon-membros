import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-[#BFA783]/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[#BFA783] text-[#0A1115] font-semibold shadow-sm",
        secondary:
          "bg-[#1D292F] text-[#F5F3EF] border border-[#695C49]/40",
        destructive:
          "bg-[#8B2E2E]/20 text-[#F5F3EF] border border-[#8B2E2E]/40",
        outline:
          "border border-[#695C49]/60 text-[#E9DDC9] bg-[#172127]/50",
        ghost:
          "text-[#A6ACAF] hover:text-[#F5F3EF] hover:bg-[#172127]",
        link: "text-[#BFA783] underline-offset-4 hover:underline",
        premium:
          "bg-gradient-to-r from-[#BFA783] via-[#D5C2A4] to-[#BFA783] text-[#0A1115] font-bold border border-[#E9DDC9]/40 shadow-[0_2px_10px_rgba(191,167,131,0.2)]",
        admin:
          "bg-[#BFA783]/15 text-[#E9DDC9] border border-[#BFA783]/40 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
