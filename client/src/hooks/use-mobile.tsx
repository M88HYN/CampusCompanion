/*
==========================================================
File: client/src/hooks/use-mobile.tsx

Module: Core Platform

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Application Layer (Business and Interaction Logic)

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

const MOBILE_BREAKPOINT = 768

/*
----------------------------------------------------------
Function: useIsMobile

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- None: Operates using closure/module state only

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        /*
    ----------------------------------------------------------
    Function: onChange

    Purpose:
    Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

    Parameters:
    - None: Operates using closure/module state only

    Process:
    1. Accepts and normalizes inputs before core processing
    2. Applies relevant guards/validation to prevent invalid transitions
    3. Executes primary logic path and handles expected edge conditions
    4. Returns a deterministic output for the caller layer

    Why Validation is Important:
    Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

    Returns:
    A value/promise representing the outcome of the executed logic path.
    ----------------------------------------------------------
    */
const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
