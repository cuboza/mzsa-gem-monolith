import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../services/api/supabaseClient';
import { UserRole } from '../types';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  city?: string;
}

interface UserSettings {
  preferredCity?: string;
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  marketingConsent?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  settings: UserSettings | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка настроек пользователя
  const loadUserSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user settings:', error);
        return null;
      }

      if (data) {
        return {
          preferredCity: data.preferred_city,
          theme: data.theme,
          emailNotifications: data.email_notifications,
          smsNotifications: data.sms_notifications,
          pushNotifications: data.push_notifications,
          marketingConsent: data.marketing_consent,
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to load settings:', err);
      return null;
    }
  };

  // Загрузка роли пользователя
  const loadUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (data?.role === 'admin') return 'admin';
      if (data?.role === 'manager') return 'manager';
      return 'user';
    } catch {
      return 'user';
    }
  };

  // Преобразование Supabase User в наш User
  const mapSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    const role = await loadUserRole(supabaseUser.id);
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Пользователь',
      role,
      phone: supabaseUser.user_metadata?.phone,
      city: supabaseUser.user_metadata?.city,
    };
  };

  // Инициализация при монтировании
  useEffect(() => {
    // Если supabase не настроен, работаем в режиме без авторизации
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    // Получаем текущую сессию
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        const mappedUser = await mapSupabaseUser(session.user);
        setUser(mappedUser);
        
        const userSettings = await loadUserSettings(session.user.id);
        setSettings(userSettings);
      }
      
      setLoading(false);
    });

    // Слушаем изменения auth состояния
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        const mappedUser = await mapSupabaseUser(session.user);
        setUser(mappedUser);
        
        const userSettings = await loadUserSettings(session.user.id);
        setSettings(userSettings);
      } else {
        setUser(null);
        setSettings(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const mappedUser = await mapSupabaseUser(data.user);
        setUser(mappedUser);
        
        const userSettings = await loadUserSettings(data.user.id);
        setSettings(userSettings);
      }

      return {};
    } catch (err) {
      return { error: 'Произошла ошибка при входе' };
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const mappedUser = await mapSupabaseUser(data.user);
        setUser(mappedUser);
      }

      return {};
    } catch (err) {
      return { error: 'Произошла ошибка при регистрации' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSettings(null);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          preferred_city: newSettings.preferredCity,
          theme: newSettings.theme,
          email_notifications: newSettings.emailNotifications,
          sms_notifications: newSettings.smsNotifications,
          push_notifications: newSettings.pushNotifications,
          marketing_consent: newSettings.marketingConsent,
          marketing_consent_date: newSettings.marketingConsent ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      settings,
      loading,
      login, 
      register, 
      logout, 
      updateSettings,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
