// AuthContext.tsx

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
  } from "react";
  import axios, { AxiosError } from "axios";
  import { User, UserRole } from "@/types/auth"; // Ensure '@/types/auth' path is correct
  
  /* ===============================
     TYPES
  ================================ */
  
  interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => void;
  }
  
  /* ===============================
     CONSTANTS
  ================================ */
  
  const API_BASE_URL = "http://localhost:8080/api";
  const TOKEN_KEY = "auth_token";
  const USER_KEY = "auth_user";
  
  /* ===============================
     AXIOS INSTANCE (SINGLE SOURCE)
  ================================ */
  
  export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  
  let globalLogoutFunction: (() => void) | null = null;
  
  
  /* ===============================
     GLOBAL INTERCEPTOR (401 FIX)
  ================================ */
  
  apiClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
          if (error.response?.status === 401) {
              console.error("401 Unauthorized detected. Global auto-logout triggered.");
              // Execute the stable logout function
              if (globalLogoutFunction) {
                  // IMPORTANT: Use setTimeout to execute logout outside the current render cycle, 
                  // preventing component tree crash errors.
                  setTimeout(() => globalLogoutFunction!(), 0);
              }
          }
          return Promise.reject(error);
      }
  );
  
  /* ===============================
     CONTEXT
  ================================ */
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  /* ===============================
     PROVIDER
  ================================ */
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
  
    const isAuthenticated = !!token;
  
      // Stable logout function
      const logout = useCallback(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
  
          delete apiClient.defaults.headers.common["Authorization"];
  
          setToken(null);
          setUser(null);
          // Optional: Hard redirect if not using a protected router wrapper
          // window.location.replace('/login'); 
      }, []); 
  
      // Link component state to global interceptor
      useEffect(() => {
          globalLogoutFunction = logout;
          return () => {
              globalLogoutFunction = null;
          };
      }, [logout]);
  
  
    /* ===============================
       RESTORE SESSION ON REFRESH
    ================================ */
    useEffect(() => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
  
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
  
        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken}`;
      }
    }, []);
  
    /* ===============================
       LOGIN
    ================================ */
    const login = async (
      email: string,
      password: string,
      role: UserRole
    ) => {
      try {
        const response = await apiClient.post("/auth/login", {
          email,
          password,
          role,
        });
  
        const { token, user } = response.data;
  
        // Persist
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
  
        // Axios header
        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
  
        // State
        setToken(token);
        setUser(user);
      } catch (error: any) {
        console.error("LOGIN ERROR:", error?.response?.data || error);
        throw new Error(
          error?.response?.data?.message || "Invalid credentials"
        );
      }
    };
  
  
    return (
      <AuthContext.Provider
        value={{
          user,
          token,
          isAuthenticated,
          login,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  
  /* ===============================
     HOOK
  ================================ */
  
  export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error("useAuth must be used inside AuthProvider");
    }
    return context;
  }