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

interface DemoStatusResponse {
  enabled: boolean;
  readOnly?: boolean;
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoReadOnly, setIsDemoReadOnly] = useState(false);

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

  const createUserFromDecoded = (decoded: JWTPayload): User => ({
    id: decoded.userId,
    username: null,
    email: decoded.email || null,
    passwordHash: null,
    firstName: decoded.firstName || null,
    lastName: decoded.lastName || null,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createUserFromDemo = (demoUser: NonNullable<DemoStatusResponse["user"]>): User => ({
    id: demoUser.id,
    username: "demo",
    email: demoUser.email || null,
    passwordHash: null,
    firstName: demoUser.firstName || "Demo",
    lastName: demoUser.lastName || "User",
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const tryDemoAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/demo-status");
      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as DemoStatusResponse;
      if (data.enabled && data.user) {
        setUser(createUserFromDemo(data.user));
        setIsDemoReadOnly(!!data.readOnly);
        setError(null);
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }, []);

  const verifyAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        const demoAuthenticated = await tryDemoAuth();
        if (demoAuthenticated) {
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        setUser(null);
        setIsDemoReadOnly(false);
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
        setIsDemoReadOnly(false);
        setError(null);
      } else {
        // If server verification fails, fall back to JWT decoding
        const decoded = decodeToken(token);
        if (decoded) {
          setUser(createUserFromDecoded(decoded));
          setIsDemoReadOnly(false);
          setError(null);
        } else {
          localStorage.removeItem("token");
          const demoAuthenticated = await tryDemoAuth();
          if (!demoAuthenticated) {
            setUser(null);
            setIsDemoReadOnly(false);
            setError("Token invalid or expired");
          }
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
          setIsDemoReadOnly(false);
          setError(null);
        } else {
          localStorage.removeItem("token");
          const demoAuthenticated = await tryDemoAuth();
          if (!demoAuthenticated) {
            setUser(null);
            setIsDemoReadOnly(false);
            setError("Token invalid or expired");
          }
        }
      } else {
        const demoAuthenticated = await tryDemoAuth();
        if (!demoAuthenticated) {
          setUser(null);
          setIsDemoReadOnly(false);
          setError(err instanceof Error ? err.message : "Auth verification failed");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [tryDemoAuth]);

  // Initial verification on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          const demoAuthenticated = await tryDemoAuth();
          if (isMounted) {
            setIsLoading(false);
            if (!demoAuthenticated) {
              setUser(null);
              setIsDemoReadOnly(false);
            }
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
            setIsDemoReadOnly(false);
            setError(null);
          }
        } else {
          // If server verification fails, fall back to JWT decoding
          const decoded = decodeToken(token);
          if (decoded && isMounted) {
            setUser(createUserFromDecoded(decoded));
            setIsDemoReadOnly(false);
            setError(null);
          } else if (isMounted) {
            localStorage.removeItem("token");
            const demoAuthenticated = await tryDemoAuth();
            if (!demoAuthenticated) {
              setUser(null);
              setIsDemoReadOnly(false);
              setError("Token invalid or expired");
            }
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
            setIsDemoReadOnly(false);
            setError(null);
          } else if (isMounted) {
            localStorage.removeItem("token");
            const demoAuthenticated = await tryDemoAuth();
            if (!demoAuthenticated) {
              setUser(null);
              setIsDemoReadOnly(false);
              setError("Token invalid or expired");
            }
          }
        } else if (isMounted) {
          const demoAuthenticated = await tryDemoAuth();
          if (!demoAuthenticated) {
            setUser(null);
            setIsDemoReadOnly(false);
            setError(err instanceof Error ? err.message : "Auth verification failed");
          }
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
  }, [tryDemoAuth]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
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

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsDemoReadOnly(false);
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
