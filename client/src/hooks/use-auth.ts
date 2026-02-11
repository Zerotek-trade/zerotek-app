import { usePrivy, getAccessToken } from "@privy-io/react-auth";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useCallback, useState } from "react";
import { useLocation } from "wouter";
import { setAccessToken } from "@/lib/authStore";

interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageData: string | null;
  privyUserId: string;
  createdAt: string | null;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { user: privyUser, ready, authenticated, login: privyLogin, logout: privyLogout } = usePrivy();
  const [tokenReady, setTokenReady] = useState(false);
  const [, setLocation] = useLocation();

  const refreshToken = useCallback(async () => {
    if (authenticated) {
      try {
        const token = await getAccessToken();
        setAccessToken(token);
        setTokenReady(true);
        return token;
      } catch {
        setAccessToken(null);
        setTokenReady(false);
        return null;
      }
    } else {
      setAccessToken(null);
      setTokenReady(false);
      return null;
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) {
      refreshToken().then(() => {
        queryClient.invalidateQueries();
      });
    }
  }, [authenticated, refreshToken, queryClient]);

  useEffect(() => {
    if (!authenticated) return;
    
    const interval = setInterval(() => {
      refreshToken();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [authenticated, refreshToken]);

  // Fetch user profile from backend
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/auth/user"],
    enabled: authenticated && tokenReady,
  });

  const user = authenticated && privyUser ? {
    id: userProfile?.id || privyUser.id,
    email: userProfile?.email || privyUser.email?.address || null,
    username: userProfile?.username || null,
    firstName: userProfile?.firstName || null,
    lastName: userProfile?.lastName || null,
    profileImageData: userProfile?.profileImageData || null,
    authProvider: "privy" as const,
    providerUserId: privyUser.id,
    createdAt: userProfile?.createdAt ? new Date(userProfile.createdAt) : new Date(),
    updatedAt: new Date(),
  } : null;

  const handleLogout = async () => {
    setAccessToken(null);
    await privyLogout();
    queryClient.clear();
    setLocation("/");
  };

  // Login and navigate to app
  const handleLogin = useCallback(() => {
    privyLogin();
  }, [privyLogin]);

  // Navigate to app when authenticated after login
  useEffect(() => {
    if (authenticated && tokenReady && window.location.pathname === "/") {
      // Small delay to ensure login modal closes
      setTimeout(() => {
        setLocation("/app");
      }, 100);
    }
  }, [authenticated, tokenReady, setLocation]);

  return {
    user,
    isLoading: !ready || (authenticated && !tokenReady),
    isAuthenticated: authenticated && !!privyUser && tokenReady,
    login: handleLogin,
    logout: handleLogout,
    isLoggingOut: false,
    privyUser,
    refreshToken,
    refetchUser: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }),
  };
}
