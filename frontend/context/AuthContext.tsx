/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: { name: string; email: string; password: string; address: string; role?: UserRole }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Load persisted session on boot
    const storedToken = localStorage.getItem("store_platform_token");
    const storedUser = localStorage.getItem("store_platform_user");

    if (storedToken && storedUser) {
      try {
        setState({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isLoading: false
        });
      } catch (err) {
        localStorage.removeItem("store_platform_token");
        localStorage.removeItem("store_platform_user");
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login fell short. Please check credentials." };
      }

      localStorage.setItem("store_platform_token", data.token);
      localStorage.setItem("store_platform_user", JSON.stringify(data.user));

      setState({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error. Please try again later." };
    }
  };

  const registerUser = async (userForm: { name: string; email: string; password: string; address: string; role?: UserRole }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Failed to register" };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error occurred." };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiFetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to change password" };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Password update network failure." };
    }
  };

  const logout = () => {
    localStorage.removeItem("store_platform_token");
    localStorage.removeItem("store_platform_user");
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  // Safe fetch wrapper injecting bearer headers
  const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (state.token) {
      headers.set("Authorization", `Bearer ${state.token}`);
    }
    
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, registerUser, changePassword, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be defined inside an AuthProvider scope");
  }
  return context;
};
