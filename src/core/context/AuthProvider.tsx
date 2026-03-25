import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Role } from '@/types';
import { supabase } from '@/core/api/supabaseClient';
import { getTenantSlug } from '@/core/tenant/tenantResolver';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkPermission: (allowedRoles: Role[]) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    currentUser: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const isFetchingSession = useRef(false);

  // ✅ Helper seguro pra evitar re-render inútil
  const setUserSafe = (user: User | null) => {
    setState(prev => {
      if (
        prev.currentUser?.id === user?.id &&
        prev.isAuthenticated === !!user &&
        prev.isLoading === false
      ) {
        return prev;
      }

      return {
        currentUser: user,
        isAuthenticated: !!user,
        isLoading: false,
      };
    });
  };

  const loadUserFromSession = async () => {
    if (isFetchingSession.current) return;

    // 🚫 se já tem usuário, não recarrega sessão
    if (state.currentUser) return;

    isFetchingSession.current = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUserSafe(null);
        isFetchingSession.current = false;
        return;
      }

      const userId = session.user.id;

      // 👉 CLIENT
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (clientData) {
        const user: User = {
          id: clientData.id,
          name: clientData.name,
          role: Role.CLIENT,
          tenant_id: '',
          auth_user_id: userId,
          email: session.user.email,
        };

        setUserSafe(user);
        isFetchingSession.current = false;
        return;
      }

      // 👉 STAFF
      const { data: staffData } = await supabase
        .from('staff')
        .select('*, tenants(id, slug)')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (staffData) {
        const t = staffData.tenants;
        const tenantId = Array.isArray(t) ? t[0]?.id : t?.id;

        const user: User = {
          id: staffData.id,
          name: staffData.name,
          role: staffData.role,
          tenant_id: tenantId,
          auth_user_id: staffData.auth_user_id,
          email: staffData.email,
        };

        setUserSafe(user);
        isFetchingSession.current = false;
        return;
      }

      // fallback
      setUserSafe(null);

    } catch (err) {
      console.error('Auth error:', err);
      setUserSafe(null);
    }

    isFetchingSession.current = false;
  };

  useEffect(() => {
    loadUserFromSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUserSafe(null);
      }

      // 🚫 IGNORA SIGNED_IN (evita flicker)
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (user: User) => {
    setUserSafe(user);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserSafe(null);

    const slug = getTenantSlug();
    window.location.href = slug ? `/login?restaurant=${slug}` : '/login';
  };

  const checkPermission = (allowedRoles: Role[]) => {
    if (!state.currentUser) return false;
    if (state.currentUser.role === Role.ADMIN) return true;
    return allowedRoles.includes(state.currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        logout,
        checkPermission,
        refreshSession: loadUserFromSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};