/*
==========================================================
File: client/src/lib/queryClient.ts

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

import { QueryClient, QueryFunction } from "@tanstack/react-query";

/*
----------------------------------------------------------
Function: throwIfResNotOk

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- res: Input consumed by this routine during execution

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
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // On 401, clear the token since it's invalid
    if (res.status === 401) {
      console.warn("[Auth] 401 Unauthorized - clearing token and triggering auth update");
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("auth-update"));
    }
    const text = (await res.text()) || res.statusText;
    const error = `${res.status}: ${text}`;
    console.error("[API Error]", res.url || "unknown", res.status, error);
    throw new Error(error);
  }
}

/*
----------------------------------------------------------
Function: apiRequest

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- method: Input consumed by this routine during execution
- url: Input consumed by this routine during execution
- data: Input consumed by this routine during execution

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
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`[apiRequest] ${method} ${url}`, data ? { hasData: true } : {});
  
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Get JWT token from localStorage
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("[apiRequest] No auth token found for:", method, url);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`[apiRequest] ${method} ${url} - Status: ${res.status}`, res.ok ? '✓' : '✗');

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
/*
----------------------------------------------------------
Function: getQueryFn

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- unauthorizedBehavior: Input consumed by this routine during execution

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
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/");
    console.log(`[getQueryFn] GET ${url}`);
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("[getQueryFn] No auth token for GET:", queryKey.join("/"));
    }

    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    console.log(`[getQueryFn] GET ${url} - Status: ${res.status}`, res.ok ? '✓' : '✗');

    if (res.status === 401) {
      // Clear invalid token on 401
      localStorage.removeItem("token");
      console.warn("[Auth] 401 on query - clearing token");
      window.dispatchEvent(new CustomEvent("auth-update"));
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`[getQueryFn] GET ${url} - Data received:`, Array.isArray(data) ? `${data.length} items` : typeof data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 30000, // 30 seconds - fresh enough for good UX, stale enough to reduce requests
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
