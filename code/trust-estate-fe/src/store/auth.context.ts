'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  type ReactNode,
  type JSX,
} from 'react';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import type { AuthState, User, AuthTokens, UserRole } from '@/types';

interface AuthContextValue extends AuthState {
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'CLEAR_AUTH' };

function authReducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_AUTH':
      return { user: null, tokens: null, isAuthenticated: false, isLoading: false };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  Buyer: '/buyer',
  PropertyOwner: '/owner',
  Agent: '/agent',
  PropertyInspector: '/inspector',
  Admin: '/admin',
};

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  useEffect(() => {
    const rehydrate = async () => {
      const token = tokenStorage.getAccess();
      if (!token) {
        dispatch({ type: 'CLEAR_AUTH' });
        return;
      }
      try {
        const user = await authService.me();
        const tokens: AuthTokens = {
          accessToken: token,
          refreshToken: tokenStorage.getRefresh() ?? '',
          expiresIn: 0,
        };
        dispatch({ type: 'SET_USER', payload: { user, tokens } });
      } catch {
        tokenStorage.clear();
        dispatch({ type: 'CLEAR_AUTH' });
      }
    };
    rehydrate();
  }, []);

  const login = useCallback((user: User, tokens: AuthTokens) => {
    tokenStorage.set(tokens);
    dispatch({ type: 'SET_USER', payload: { user, tokens } });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // always clear locally
    } finally {
      tokenStorage.clear();
      dispatch({ type: 'CLEAR_AUTH' });
      router.replace('/login');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.me();
      const token = tokenStorage.getAccess() ?? '';
      const refresh = tokenStorage.getRefresh() ?? '';
      dispatch({
        type: 'SET_USER',
        payload: { user, tokens: { accessToken: token, refreshToken: refresh, expiresIn: 0 } },
      });
    } catch {
      // handled by api-client
    }
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { ...state, login, logout, refreshUser } as AuthContextValue },
    children
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}