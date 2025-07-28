// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Define a simple User type for the context
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize user from token
  useEffect(() => {
    console.log("🔐 AuthContext useEffect triggered. Token =", token);

    const initializeAuth = async () => {
      if (token) {
        try {
          const decodedToken: any = jwtDecode(token);
          console.log("✅ Decoded token:", decodedToken);

          const userEmail = decodedToken?.sub || decodedToken?.email || 'unknown@example.com';
          const isAdmin = decodedToken?.is_admin ?? false;
          const userId = decodedToken?.user_id || userEmail;

          const newUser: User = {
            id: userId,
            name: userEmail.split('@')[0], // Use part before @ as name
            email: userEmail,
            role: isAdmin ? 'admin' : 'user',
          };

          console.log("✅ User initialized:", newUser);

          setUser(newUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("❌ Failed to decode token:", error);
          setToken(null);
          localStorage.removeItem('accessToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log("⚠️ No token in storage. User is not authenticated.");
        setIsAuthenticated(false);
        setUser(null);
      }

      setIsLoading(false);
      console.log("⏬ AuthContext isLoading = false");
    };

    initializeAuth();
  }, [token]);

  // Login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    console.log("📥 Attempting login:", email);

    try {
      const response = await axios.post('http://localhost:8000/token', new URLSearchParams({
        username: email,
        password: password,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      console.log("✅ Login successful. Token received:", access_token);

      localStorage.setItem('accessToken', access_token);
      setToken(access_token); // Will trigger useEffect to decode and set auth

    } catch (error: any) {
      console.error("❌ Login failed:", error.response ? error.response.data : error.message);
      localStorage.removeItem('accessToken');
      setToken(null);
      setIsAuthenticated(false);
      setUser(null);
      throw error; // Let the form handle it
    } finally {
      setIsLoading(false);
      console.log("📴 Login process completed.");
    }
  };

  // Logout
  const logout = () => {
    console.log("👋 Logging out...");
    setToken(null);
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ login, logout, isAuthenticated, token, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
