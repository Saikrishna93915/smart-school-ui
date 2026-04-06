import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import apiClient from "../Services/apiClient";
import { User, UserRole } from "../types/auth";
import { clearStoredAuth, getStoredToken, getStoredUser, setStoredAuth } from "@/lib/auth/storage";

const TOKEN_KEY = "token";
const USER_KEY = "user";

/**
 * SESSION STORAGE STRATEGY FOR TAB ISOLATION
 * ==========================================
 * Using sessionStorage instead of localStorage to ensure:
 * 1. Each browser tab has its own independent session
 * 2. Login as student in Tab 1, admin in Tab 2 → each maintains separate auth
 * 3. Refreshing Tab 1 keeps the Tab 1 session (not the latest from other tabs)
 * 4. JWT token (30 min expiry) persists on refresh within the same tab
 * 5. Closing the tab clears its session automatically
 *
 * Fallback to localStorage on initial load for backward compatibility
 */

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* =========================
     RESTORE SESSION ON MOUNT
  ========================= */
  useEffect(() => {
    const restoreSession = () => {
      try {
        // First try sessionStorage (tab-specific)
        let storedToken = sessionStorage.getItem(TOKEN_KEY);
        let storedUser = sessionStorage.getItem(USER_KEY);

        // Fallback to localStorage during initial login if sessionStorage is empty
        if (!storedToken) {
          storedToken = getStoredToken();
          storedUser = getStoredUser();
          
          // If found in localStorage, move to sessionStorage for this tab
          if (storedToken && storedUser) {
            sessionStorage.setItem(TOKEN_KEY, storedToken);
            sessionStorage.setItem(USER_KEY, storedUser);
            // Keep in localStorage too for backward compatibility
          }
        }

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          
          // Validate stored user data
          if (parsedUser && parsedUser.role && parsedUser.name) {
            console.log(`✅ Session restored for user: ${parsedUser.name} (${parsedUser.role})`);
            setToken(storedToken);
            setUser(parsedUser);
            apiClient.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          } else {
            // Invalid stored user data, clear it
            clearAuth();
          }
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /* =========================
     CLEAR AUTH DATA
  ========================= */
  const clearAuth = useCallback(() => {
    // Clear from both sessionStorage (this tab) and localStorage
    clearStoredAuth();
    delete apiClient.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
    console.log('✋ Auth cleared');
  }, []);

  /* =========================
     LOGIN FUNCTION (FIXED)
  ========================= */
  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    
    try {
      // Validate input
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required");
      }

      const response = await apiClient.post("/auth/login", {
        username: email,
        password,
        role,
      });

      // Check if response indicates an error
      if (response.status >= 400 && response.status < 500) {
        // Handle client errors (400-499)
        const errorMessage = response.data?.message || 
                           response.data?.error || 
                           `Login failed (${response.status})`;
        throw new Error(errorMessage);
      }

      // Only proceed if we have a successful response (200-299)
      if (response.status >= 200 && response.status < 300) {
        const { token, role: userRole, name, forcePasswordChange, _id, id } = response.data;

        // Validate required fields in response
        if (!token || !userRole || !name) {
          throw new Error("Invalid response from server");
        }

        const userData: User = {
          _id: _id || id,
          id: id || _id,
          name,
          role: userRole,
          forcePasswordChange: forcePasswordChange || false,
          email,
        };

        // Store in BOTH sessionStorage (this tab) and localStorage (backup)
        // sessionStorage ensures each tab has its own session
        // localStorage is fallback for backward compatibility
        setStoredAuth(token, JSON.stringify(userData));

        // Update axios defaults
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Update state
        setToken(token);
        setUser(userData);
        console.log(`✅ Login successful: ${userData.name} (${userData.role}) - Session stored in sessionStorage`);

        return; // Success
      } else {
        // Handle other status codes
        throw new Error(`Unexpected response: ${response.status}`);
      }
      
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);
      
      // Clear any potentially corrupted auth data
      clearAuth();
      
      // Extract meaningful error message
      let errorMessage = "Login failed. Please try again.";
      
      if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid request";
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied for this role";
      } else if (error.response?.status === 404) {
        errorMessage = "User not found";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = useCallback(() => {
    clearAuth();
    
    // Optional: Call logout endpoint if needed
    try {
      apiClient.post("/auth/logout").catch(() => {
        // Ignore errors on logout endpoint
      });
    } catch {
      // Ignore errors
    }
  }, [clearAuth]);

  /* =========================
     AUTO-LOGOUT ON 401 RESPONSES
  ========================= */
  useEffect(() => {
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestUrl = (error.config?.url || '') as string;
        const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/logout');

        if (error.response?.status === 401 && !isAuthEndpoint) {
          // Auto-logout on 401
          console.warn("Auto-logout due to 401 response");
          logout();
          
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor
    return () => {
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* =========================
   USE AUTH HOOK
========================= */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/* =========================
   HELPER HOOK FOR PROTECTED ROUTES
========================= */
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    requireAuth: (redirectTo: string = "/login") => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = redirectTo;
        return false;
      }
      return isAuthenticated;
    }
  };
};
