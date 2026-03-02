/*
==========================================================
File: shared/ports.ts

Module: Core Platform

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Shared Domain Layer

System Interaction:
- Defines shared contracts and schema primitives consumed by both frontend and backend
- Provides type-safe boundaries that reduce coupling and integration defects

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

/**
 * CENTRALIZED PORT CONFIGURATION
 * 
 * Single source of truth for all service ports.
 * DO NOT define ports anywhere else in the codebase.
 * 
 * NON-NEGOTIABLE RULES:
 * - Ports are fixed and explicit
 * - No auto-incrementing ports
 * - No silent fallbacks
 * - App must crash if a port is occupied
 */

export const PORTS = {
  FRONTEND: 5173,
  API: 3000,
  WS: 3001,
} as const;

export type PortConfig = typeof PORTS;
