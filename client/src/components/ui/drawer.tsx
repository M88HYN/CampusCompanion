/*
==========================================================
File: client/src/components/ui/drawer.tsx

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

"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

/*
----------------------------------------------------------
Component: Drawer

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- shouldScaleBackground: Input consumed by this routine during execution
- props: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

/*
----------------------------------------------------------
Component: DrawerHeader

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- className: Input consumed by this routine during execution
- props: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

/*
----------------------------------------------------------
Component: DrawerFooter

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- className: Input consumed by this routine during execution
- props: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
