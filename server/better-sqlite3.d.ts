/*
==========================================================
File: server/better-sqlite3.d.ts

Module: Core Platform

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
API Routing and Service Layer

System Interaction:
- Receives HTTP requests and coordinates validation, authorization, and business workflows
- Interacts with storage/database adapters and shared schemas for consistent persistence

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

declare module 'better-sqlite3' {
  export interface Database {
    prepare(sql: string): any;
    exec(sql: string): void;
    pragma(pragma: string, options?: any): any;
    close(): void;
  }

  export interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message: string) => void;
  }

    /*
  ----------------------------------------------------------
  Function: Database

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - filename: Input consumed by this routine during execution
  - options: Input consumed by this routine during execution

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
function Database(filename: string, options?: Options): Database;

  export default Database;
}
