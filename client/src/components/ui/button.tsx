/*
==========================================================
File: client/src/components/ui/button.tsx

Module: Frontend Experience

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Presentation Layer (Frontend UI)

System Interaction:
- Consumes API endpoints via query/mutation utilities and renders user-facing interfaces
- Collaborates with shared types to preserve frontend-backend contract integrity

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { buttonTapDuration, easeOutCurve } from "@/lib/animations"

const buttonVariants = cva(
  "playful-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-[1px] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-brand-primary to-secondary text-primary-foreground border border-primary-border shadow-sm hover:from-[hsl(223_64%_30%)] hover:via-[hsl(223_64%_34%)] hover:to-[hsl(191_96%_38%)] hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border hover:bg-[hsl(0_84%_54%)]",
        outline:
          // Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color.
          "border bg-card/80 [border-color:var(--button-outline)] shadow-xs hover:bg-accent/30 hover:shadow-sm active:shadow-none",
        secondary: "border bg-gradient-to-r from-secondary to-[hsl(191_96%_36%)] text-secondary-foreground border border-secondary-border shadow-sm hover:from-[hsl(191_96%_38%)] hover:to-[hsl(191_96%_32%)] hover:shadow-md",
        // Add a transparent border so that when someone toggles a border on later, it doesn't shift layout/size.
        ghost: "border border-transparent hover:bg-accent/45",
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-9 rounded-xl px-3 text-xs",
        lg: "min-h-11 rounded-xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion()

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <motion.button
        type={type ?? "button"}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.985, y: 0.5 }}
        transition={{ duration: buttonTapDuration, ease: easeOutCurve }}
        {...(props as any)}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
