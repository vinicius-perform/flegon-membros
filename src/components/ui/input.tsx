import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-[#695C49]/35 bg-[#172127]/90 px-4 py-2 text-sm text-[#F5F3EF] placeholder:text-[#A6ACAF]/60 transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-[#BFA783] focus-visible:ring-2 focus-visible:ring-[#BFA783]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[#8B2E2E] aria-invalid:ring-2 aria-invalid:ring-[#8B2E2E]/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
