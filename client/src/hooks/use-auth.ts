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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    isLoggingOut: false,
    error,
    verifyAuth,
  };
}
