import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';
import jwtDecode from 'jwt-decode';

interface TokenPayload {
  userId: number;
  keystoneId: string;
  iat?: number;
  exp?: number;
}

interface AuthContextType {
  user: TokenPayload | null;
  projects: { id: number; name: string; keystoneId: string }[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  createProject: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch {
      setProjects([]);
    }
  };

  const initAuth = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const payload = jwtDecode<TokenPayload>(accessToken);
        setUser(payload);
        await fetchProjects();
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken } = res.data;
    saveTokens(accessToken, refreshToken);
    const payload = jwtDecode<TokenPayload>(accessToken);
    setUser(payload);
    await fetchProjects();
  };

  const register = async (email: string, name: string, password: string) => {
    const res = await api.post('/auth/register', { email, name, password });
    const { accessToken, refreshToken } = res.data;
    saveTokens(accessToken, refreshToken);
    const payload = jwtDecode<TokenPayload>(accessToken);
    setUser(payload);
    await fetchProjects();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setProjects([]);
  };

  const createProject = async (name: string) => {
    const res = await api.post('/projects', { name });
    setProjects((prev) => [...prev, res.data]);
  };

  return (
    <AuthContext.Provider value={{ user, projects, loading, login, register, logout, createProject }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);