// src/contexts/AuthContext.tsx
import  {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode, // Add 'type' keyword
} from "react";
import type { TikTokAuthState } from "../types/tiktok";
import {
  getStoredTokens,
  clearTokens,
  isTokenValid,
  initiateOAuthFlow,
  handleOAuthCallback,
} from "../services/oauth";
import { getAdvertiserInfo } from "../services/tiktokApi";

// Extend the base state with methods
interface AuthContextType extends TikTokAuthState {
  login: () => void;
  logout: () => void;
  handleCallback: (code: string, state: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TikTokAuthState>({
    isAuthenticated: false,
    accessToken: null, // Changed from 'tokens' to match your type
    advertiserId: null,
    user: null, // Need to add to TikTokAuthState type
    loading: true, // Need to add to TikTokAuthState type
    error: null, // Need to add to TikTokAuthState type
  });

  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens();

      if (tokens && isTokenValid(tokens)) {
        try {
          const user = await getAdvertiserInfo(tokens.accessToken); // Use accessToken not access_token

          setState({
            isAuthenticated: true,
            accessToken: tokens.accessToken,
            advertiserId: user.advertiser_id,
            user,
            loading: false,
            error: null,
          });
        } catch (error) {
          clearTokens();
          setState({
            isAuthenticated: false,
            accessToken: null,
            advertiserId: null,
            user: null,
            loading: false,
            error: null,
          });
        }
      } else {
        setState({
          isAuthenticated: false,
          accessToken: null,
          advertiserId: null,
          user: null,
          loading: false,
          error: null,
        });
      }
    };

    initAuth();
  }, []);

  const login = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    initiateOAuthFlow();
  };

  const logout = () => {
    clearTokens();
    setState({
      isAuthenticated: false,
      accessToken: null,
      advertiserId: null,
      user: null,
      loading: false,
      error: null,
    });
  };

  const handleCallback = async (code: string, callbackState: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const tokens = await handleOAuthCallback(code, callbackState);
      const user = await getAdvertiserInfo(tokens.accessToken);

      setState({
        isAuthenticated: true,
        accessToken: tokens.accessToken,
        advertiserId: user.advertiser_id,
        user,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";

      setState({
        isAuthenticated: false,
        accessToken: null,
        advertiserId: null,
        user: null,
        loading: false,
        error: errorMessage,
      });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    handleCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
