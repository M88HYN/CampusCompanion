import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // On 401, clear the token since it's invalid
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("auth-update"));
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Get JWT token from localStorage
  const token = localStorage.getItem("token");
  if (token) {
    console.log("Sending token:", token.substring(0, 50) + "...");
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("No token found in localStorage for request:", method, url);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    const token = localStorage.getItem("token");
    if (token) {
      console.log("GET request token:", token.substring(0, 50) + "...");
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("No token in localStorage for GET request:", queryKey.join("/"));
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (res.status === 401) {
      // Clear invalid token on 401
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("auth-update"));
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
