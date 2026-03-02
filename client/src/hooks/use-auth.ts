/*
==========================================================
File: client/src/hooks/use-auth.ts

Module: Authentication and Access Control

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

import { useEffect, useState, useCallback } from "react";
import type { User } from "@shared/models/auth";

interface JWTPayload {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

/*
----------------------------------------------------------
Function: useAuth

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
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDemoReadOnly = false;

    /*
  ----------------------------------------------------------
  Function: decodeToken

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - token: Input consumed by this routine during execution

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
const decodeToken = (token: string): JWTPayload | null => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      
      const decoded = JSON.parse(atob(parts[1]));
      
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }
      
      return decoded;
    } catch {
      return null;
    }
  };

    /*
  ----------------------------------------------------------
  Function: createUserFromDecoded

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - decoded: Input consumed by this routine during execution

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
const createUserFromDecoded = (decoded: JWTPayload): User => ({
    id: decoded.userId,
    username: null,
    email: decoded.email || null,
    passwordHash: null,
    firstName: decoded.firstName || null,
    lastName: decoded.lastName || null,
    profileImageUrl: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const verifyAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        setUser(null);
        return;
      }

      // First try to verify with server
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setError(null);
      } else {
        // If server verification fails, fall back to JWT decoding
        const decoded = decodeToken(token);
        if (decoded) {
          setUser(createUserFromDecoded(decoded));
          setError(null);
        } else {
          localStorage.removeItem("token");
          setUser(null);
          setError("Token invalid or expired");
        }
      }
    } catch (err) {
      console.error("Auth verification failed:", err);
      
      // Fall back to JWT decoding on network error
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = decodeToken(token);
        if (decoded) {
          setUser(createUserFromDecoded(decoded));
          setError(null);
        } else {
          localStorage.removeItem("token");
          setUser(null);
          setError("Token invalid or expired");
        }
      } else {
        setUser(null);
        setError(err instanceof Error ? err.message : "Auth verification failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial verification on mount
  useEffect(() => {
    let isMounted = true;
    
        /*
    ----------------------------------------------------------
    Function: checkAuth

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
const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (isMounted) {
            setIsLoading(false);
            setUser(null);
          }
          return;
        }

        // First try to verify with server
        const response = await fetch("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setUser(data.user);
            setError(null);
          }
        } else {
          // If server verification fails, fall back to JWT decoding
          const decoded = decodeToken(token);
          if (decoded && isMounted) {
            setUser(createUserFromDecoded(decoded));
            setError(null);
          } else if (isMounted) {
            localStorage.removeItem("token");
            setUser(null);
            setError("Token invalid or expired");
          }
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        
        // Fall back to JWT decoding on network error
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = decodeToken(token);
          if (decoded && isMounted) {
            setUser(createUserFromDecoded(decoded));
            setError(null);
          } else if (isMounted) {
            localStorage.removeItem("token");
            setUser(null);
            setError("Token invalid or expired");
          }
        } else if (isMounted) {
          setUser(null);
          setError(err instanceof Error ? err.message : "Auth verification failed");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
        /*
    ----------------------------------------------------------
    Function: handleStorageChange

    Purpose:
    Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

    Parameters:
    - e: Input consumed by this routine during execution

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
const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && e.newValue !== e.oldValue) {
        verifyAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [verifyAuth]);

  // Listen for custom auth event from login component
  useEffect(() => {
        /*
    ----------------------------------------------------------
    Function: handleAuthUpdate

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
const handleAuthUpdate = () => {
      // Debounce auth updates to prevent rapid re-renders
      setIsLoading(true);
      setTimeout(() => {
        verifyAuth();
      }, 100);
    };

    window.addEventListener("auth-update", handleAuthUpdate);
    return () => window.removeEventListener("auth-update", handleAuthUpdate);
  }, [verifyAuth]);

    /*
  ----------------------------------------------------------
  Function: logout

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
const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDemoReadOnly,
    logout,
    isLoggingOut: false,
    error,
    verifyAuth,
  };
}
