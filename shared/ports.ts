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
