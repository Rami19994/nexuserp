import React, { createContext, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogin, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import type { AuthUser, LoginBody } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    } as any
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const login = async (data: LoginBody) => {
    try {
      await loginMutation.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Welcome back", description: "Successfully logged in." });
      setLocation("/");
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Login failed", 
        description: err.response?.data?.error || "Invalid credentials" 
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      queryClient.setQueryData(getGetMeQueryKey(), null);
      setLocation("/login");
      toast({ title: "Logged out", description: "You have been securely logged out." });
    } catch (err) {
      console.error(err);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Auth guard effect
  useEffect(() => {
    if (!isLoading && !user && window.location.pathname !== "/login") {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
