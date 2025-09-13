import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-2 border-black bg-black text-white hover:bg-white hover:text-black",
        secondary: "border-2 border-black bg-white text-black hover:bg-black hover:text-white",
        destructive: "border-2 border-black bg-black text-white hover:bg-red-600",
        outline: "border-2 border-black bg-transparent hover:bg-black hover:text-white",
        ghost: "hover:bg-black hover:text-white",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
      shadow: {
        none: "",
        default: "shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shadow: "none",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shadow, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shadow, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }