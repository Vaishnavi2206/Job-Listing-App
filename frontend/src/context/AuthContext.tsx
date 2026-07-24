import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { User } from "../types";
import { logoutUser, refreshUserSession } from "../services/auth.service";
import {
  clearSessionActivity,
  getRemainingIdleTime,
  isSessionIdleExpired,
  markSessionActivity,
} from "../utils/authSession";

type AuthContextValue = {
  token: string | null;
  setToken: (token: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");

    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });

  const isAuthenticated = !!token;
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const refreshSession = useCallback(async () => {
    const response = await refreshUserSession();

    markSessionActivity();
    setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      clearSessionActivity();
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      clearSessionActivity();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (isSessionIdleExpired()) {
          clearSessionActivity();
          setToken(null);
          return;
        }

        await refreshSession();
      } catch {
        setToken(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleSessionRefreshed = (event: Event) => {
      const { accessToken, user } = (
        event as CustomEvent<{
          accessToken: string;
          user: User;
        }>
      ).detail;

      markSessionActivity();
      setToken(accessToken);
      setUser(user);
    };

    const handleSessionExpired = () => {
      clearSessionActivity();
      setToken(null);
    };

    window.addEventListener("auth:session-refreshed", handleSessionRefreshed);
    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("auth:session-refreshed", handleSessionRefreshed);
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      clearSessionActivity();

      return;
    }

    markSessionActivity();

    let timeoutId: number | undefined;

    const scheduleIdleLogout = () => {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        logout();
      }, getRemainingIdleTime());
    };

    const handleActivity = () => {
      if (!tokenRef.current) {
        return;
      }

      if (isSessionIdleExpired()) {
        logout();

        return;
      }

      markSessionActivity();
      scheduleIdleLogout();
    };

    const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart", "focus"];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, {
        passive: true,
      });
    });
    scheduleIdleLogout();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [logout, token]);

  const value = useMemo(
    () => ({
      token,
      setToken,
      user,
      setUser,
      isAuthenticated,
      isAuthLoading,
      refreshSession,
      logout,
    }),
    [token, user, isAuthenticated, isAuthLoading, refreshSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
