import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  isCloudConnected: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  lockScreen: () => void;
  unlockScreen: (password: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  registeredUsers: User[];
}

const STORAGE_KEYS = {
  IS_LOCKED: 'financontrol_auth_is_locked_cloud_v1',
  LOCAL_USERS_BACKUP: 'financontrol_auth_users_clean_v2'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.IS_LOCKED) === 'true';
    } catch {
      return false;
    }
  });

  // Fetch or create user profile from public.profiles in Supabase
  const loadUserProfile = async (supabaseUser: any) => {
    if (!supabaseUser) {
      setCurrentUser(null);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      const userName = profile?.name || 
        supabaseUser.user_metadata?.name || 
        (supabaseUser.email ? supabaseUser.email.split('@')[0] : 'Usuário');

      // If profile doesn't exist yet, insert it
      if (!profile && isSupabaseConfigured) {
        await supabase.from('profiles').upsert({
          id: supabaseUser.id,
          name: userName,
          email: supabaseUser.email || '',
          updated_at: new Date().toISOString()
        });
      }

      setCurrentUser({
        id: supabaseUser.id,
        name: userName,
        email: supabaseUser.email || '',
        avatarUrl: profile?.avatar_url,
        createdAt: profile?.created_at || supabaseUser.created_at || new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Erro ao carregar perfil do Supabase, usando dados da sessão', e);
      setCurrentUser({
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuário',
        email: supabaseUser.email || '',
        createdAt: supabaseUser.created_at || new Date().toISOString()
      });
    }
  };

  // 1. Initialize Supabase Auth state listener
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error('Erro ao recuperar sessão do Supabase:', error);
      }
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    // Listen to auth events (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLocked(false);
        try {
          sessionStorage.removeItem(STORAGE_KEYS.IS_LOCKED);
        } catch {
          // ignore
        }
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 2. Login handler via Supabase Auth
  const login = async (
    email: string, 
    password: string, 
    _rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      return { 
        success: false, 
        error: 'Supabase não configurado. Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.' 
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'E-mail ou senha incorretos. Por favor, confira suas credenciais.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'E-mail ainda não confirmado. Verifique a caixa de entrada do seu e-mail.' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user);
        setIsLocked(false);
        try {
          sessionStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
        } catch {
          // ignore
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao conectar com o serviço de autenticação.' };
    }
  };

  // 3. Register handler via Supabase Auth
  const register = async (
    name: string, 
    email: string, 
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      return { success: false, error: 'Por favor, informe seu nome completo.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Por favor, informe um endereço de e-mail válido.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'A senha deve conter no mínimo 6 caracteres no Supabase Auth.' };
    }

    if (!isSupabaseConfigured) {
      return { 
        success: false, 
        error: 'Supabase não configurado. Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.' 
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: cleanName
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { success: false, error: 'Este e-mail já está cadastrado. Faça login ou utilize outro e-mail.' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create initial profile in public.profiles table
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: cleanName,
            email: cleanEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Profile upsert notice:', e);
        }

        await loadUserProfile(data.user);
        setIsLocked(false);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao cadastrar usuário no Supabase.' };
    }
  };

  // 4. Logout handler
  const logout = async () => {
    setCurrentUser(null);
    setIsLocked(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.IS_LOCKED);
    } catch {
      // ignore
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  };

  // 5. Lock screen handler
  const lockScreen = () => {
    setIsLocked(true);
    try {
      sessionStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
    } catch {
      // ignore
    }
  };

  // 6. Unlock screen handler (re-authenticate with password via Supabase Auth)
  const unlockScreen = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Nenhum usuário ativo na sessão.' };
    }

    if (!isSupabaseConfigured) {
      setIsLocked(false);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: password
      });

      if (error) {
        return { success: false, error: 'Senha incorreta para desbloquear a sessão.' };
      }

      setIsLocked(false);
      try {
        sessionStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
      } catch {
        // ignore
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao validar senha.' };
    }
  };

  // 7. Delete account handler
  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Nenhum usuário ativo para excluir.' };
    }

    if (!isSupabaseConfigured) {
      setCurrentUser(null);
      return { success: true };
    }

    try {
      // Verify password first
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: password
      });

      if (authErr) {
        return { success: false, error: 'Senha incorreta. Não foi possível confirmar a exclusão da conta.' };
      }

      // Try RPC function if configured
      try {
        await supabase.rpc('delete_user_account');
      } catch {
        // Fallback: delete from profiles and sign out
        await supabase.from('profiles').delete().eq('id', currentUser.id);
      }

      await logout();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir conta.' };
    }
  };

  const isAuthenticated = !!currentUser && !isLocked;
  const registeredUsers = currentUser ? [currentUser] : [];

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLocked,
        isCloudConnected: isSupabaseConfigured,
        isAuthLoading,
        login,
        register,
        logout,
        lockScreen,
        unlockScreen,
        deleteAccount,
        registeredUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
