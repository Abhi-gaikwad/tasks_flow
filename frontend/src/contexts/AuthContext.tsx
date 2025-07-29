// D:\\Prasaar Tech\\task-main\\frontend\\src\\contexts\\AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { User } from '../types'; // Import User type from central types file

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Ensure this matches your FastAPI backend URL
console.log("Frontend API Base URL:", API_BASE_URL); // For debugging

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to indicate loading auth state

  useEffect(() => {
    const loadUserFromToken = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        try {
          const decoded: any = jwtDecode(storedToken);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            console.warn("Token expired. Logging out.");
            logout(); // Use the logout function to clear state
            return;
          }

          // Fetch current user details from backend to get full user object including ID and other details
          const response = await axios.get(`${API_BASE_URL}/users/me/`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          const currentUserBackend = response.data; // This will be schemas.UserInDB

          const authenticatedUser: User = {
            id: String(currentUserBackend.id), // Map backend int id to frontend string id
            name: currentUserBackend.email.split('@')[0], // Derive name from email
            email: currentUserBackend.email,
            role: currentUserBackend.is_admin ? 'admin' : 'user',
            avatar: `https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400`, // Default avatar
            canAssignTasks: currentUserBackend.is_admin, // Derived from is_admin
            isActive: true, // Assuming active if authenticated
            createdAt: new Date(), // Placeholder as backend UserInDB doesn't have this
            lastLogin: new Date(), // Placeholder
          };

          setToken(storedToken);
          setIsAuthenticated(true);
          setUser(authenticatedUser);
          console.log("Auth state loaded:", authenticatedUser);
        } catch (error) {
          console.error("Failed to decode token or fetch user details:", error);
          logout();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    loadUserFromToken();
  }, []); // Run once on component mount

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/token`, new URLSearchParams({
        username: email,
        password: password,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
      console.log('Login successful. Token set. Now reloading user details.');

      // After successful login, immediately load user details
      const decoded: any = jwtDecode(access_token);
      const responseMe = await axios.get(`${API_BASE_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const currentUserBackend = responseMe.data;

      const authenticatedUser: User = {
        id: String(currentUserBackend.id),
        name: currentUserBackend.email.split('@')[0],
        email: currentUserBackend.email,
        role: currentUserBackend.is_admin ? 'admin' : 'user',
        avatar: `https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400`,
        canAssignTasks: currentUserBackend.is_admin,
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      setIsAuthenticated(true);
      setUser(authenticatedUser);
      console.log("Login and user details loaded:", authenticatedUser);

    } catch (error: any) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      setToken(null);
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      setUser(null);
      console.log("Login failed: isAuthenticated =", false);
      throw error;
    } finally {
      setIsLoading(false);
      console.log("Login process finished. isLoading set to false.");
    }
  };

  const logout = () => {
    console.log("Logging out...");
    setToken(null);
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    setUser(null);
    setIsLoading(false); // Ensure loading is false after logout
    console.log("Logged out: isAuthenticated =", false, "User:", null);
  };

  return (
    <AuthContext.Provider value={{ login, logout, isAuthenticated, token, user, isLoading }}>
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