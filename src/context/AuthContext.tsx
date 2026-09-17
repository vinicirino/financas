import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (password: string) => Promise<{ success: boolean; error?: string }>;
  registeredUsers: User[];
  demoAccounts: { email: string; pass: string; name: string }[];
}

const STORAGE_KEYS = {
  USERS: 'financontrol_auth_users_v1',
  ACTIVE_USER_ID: 'financontrol_auth_active_user_id_v1',
  IS_LOCKED: 'financontrol_auth_is_locked_v1',
  REMEMBER_ME: 'financontrol_auth_remember_me_v1',
};

// SHA-256 password hashing with fallback
async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + '_financontrol_salt_2026');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto error, falling back to simple hash', e);
  }
  
  // Fallback simple deterministic hash
  let hash = 0;
  const str = password + '_financontrol_salt_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'simple_' + Math.abs(hash).toString(16);
}

const DEMO_ACCOUNTS = [
  {
    email: 'vinicirino@gmail.com',
    pass: '123456',
    name: 'Vinicius Cirino'
  },
  {
    email: 'admin@financontrol.com',
    pass: 'admin123',
    name: 'Administrador'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      if (remember) {
        return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
      }
      return sessionStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    } catch {
      return null;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.IS_LOCKED) === 'true';
    } catch {
      return false;
    }
  });

  // Seed default demo accounts if not existing
  useEffect(() => {
    const initDemoAccounts = async () => {
      const existing = [...registeredUsers];
      let changed = false;

      for (const demo of DEMO_ACCOUNTS) {
        const found = existing.some(u => u.email.toLowerCase() === demo.email.toLowerCase());
        if (!found) {
          const passHash = await hashPassword(demo.pass);
          existing.push({
            id: 'user_' + demo.email.replace(/[^a-zA-Z0-9]/g, '_'),
            name: demo.name,
            email: demo.email,
            passwordHash: passHash,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          });
          changed = true;
        }
      }

      if (changed || existing.length === 0) {
        setRegisteredUsers(existing);
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existing));
        } catch (e) {
          console.error(e);
        }
      }
    };

    initDemoAccounts();
  }, []);

  // Save users changes
  useEffect(() => {
    if (registeredUsers.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(registeredUsers));
      } catch (e) {
        console.error(e);
      }
    }
  }, [registeredUsers]);

  const currentUser = registeredUsers.find(u => u.id === currentUserId) || null;
  const isAuthenticated = !!currentUser && !isLocked;

  // Login handler
  const login = async (
    email: string, 
    password: string, 
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const user = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { 
        success: false, 
        error: 'Nenhum usuário encontrado com este e-mail. Verifique a digitação ou crie uma nova conta.' 
      };
    }

    const hashedInput = await hashPassword(password);
    if (user.passwordHash !== hashedInput) {
      return { 
        success: false, 
        error: 'Senha incorreta. Por favor, tente novamente ou use a conta de demonstração.' 
      };
    }

    // Update last login
    const updatedUser: User = {
      ...user,
      lastLoginAt: new Date().toISOString()
    };
    setRegisteredUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

    setCurrentUserId(user.id);
    setIsLocked(false);

    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, user.id);
      } else {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'false');
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, user.id);
      }
      sessionStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  };

  // Register handler
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
    if (!password || password.length < 4) {
      return { success: false, error: 'A senha deve conter no mínimo 4 caracteres.' };
    }

    const alreadyExists = registeredUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (alreadyExists) {
      return { success: false, error: 'Este e-mail já está cadastrado. Faça login ou utilize outro e-mail.' };
    }

    const passHash = await hashPassword(password);
    const newUser: User = {
      id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      email: cleanEmail,
      passwordHash: passHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const nextUsers = [...registeredUsers, newUser];
    setRegisteredUsers(nextUsers);
    setCurrentUserId(newUser.id);
    setIsLocked(false);

    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, newUser.id);
      sessionStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setCurrentUserId(null);
    setIsLocked(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
      sessionStorage.removeItem(STORAGE_KEYS.IS_LOCKED);
    } catch (e) {
      console.error(e);
    }
  };

  // Lock screen
  const lockScreen = () => {
    setIsLocked(true);
    try {
      sessionStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Unlock screen
  const unlockScreen = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Nenhum usuário ativo na sessão.' };
    }

    const hashedInput = await hashPassword(password);
    if (currentUser.passwordHash !== hashedInput) {
      return { success: false, error: 'Senha incorreta para desbloquear a sessão.' };
    }

    setIsLocked(false);
    try {
      sessionStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLocked,
        login,
        register,
        logout,
        lockScreen,
        unlockScreen,
        registeredUsers,
        demoAccounts: DEMO_ACCOUNTS
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
