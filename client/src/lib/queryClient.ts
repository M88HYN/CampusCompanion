import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
