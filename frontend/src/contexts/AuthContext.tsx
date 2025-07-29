    // D:\Prasaar Tech\task-main\frontend\src\contexts\AuthContext.tsx
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

    // Get API base URL from environment variable
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    console.log("Frontend API Base URL:", API_BASE_URL); // For debugging

    export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
      const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
      const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
      const [user, setUser] = useState<User | null>(null);
      const [isLoading, setIsLoading] = useState<boolean>(true);

      useEffect(() => {
        console.log("AuthContext useEffect triggered. Current token:", token);

        const initializeAuth = async () => {
          if (token) {
            try {
              const decodedToken: any = jwtDecode(token);
              console.log("Decoded token in useEffect:", decodedToken);

              const userEmail = decodedToken.sub;
              const isAdmin = decodedToken.is_admin || false;
              const userId = decodedToken.user_id || userEmail;

              const newUser: User = {
                id: userId,
                name: userEmail,
                email: userEmail,
                role: isAdmin ? 'admin' : 'user',
              };
              setUser(newUser);
              setIsAuthenticated(true);
              console.log("Auth initialized: isAuthenticated =", true, "User:", newUser);

            } catch (error) {
              console.error("Failed to decode token or re-authenticate in useEffect:", error);
              setToken(null);
              localStorage.removeItem('accessToken');
              setIsAuthenticated(false);
              setUser(null);
              console.log("Auth failed in useEffect: isAuthenticated =", false);
            }
          } else {
            console.log("No token found in localStorage. isAuthenticated =", false);
            setIsAuthenticated(false);
            setUser(null);
          }
          setIsLoading(false);
          console.log("AuthContext isLoading set to false.");
        };
        initializeAuth();
      }, [token]);


      const login = async (email: string, password: string) => {
        setIsLoading(true);
        console.log("Attempting login for:", email);
        try {
          // Use the API_BASE_URL for the login endpoint
          const response = await axios.post(`${API_BASE_URL}/token`, new URLSearchParams({
            username: email,
            password: password,
          }), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });

          const { access_token } = response.data;
          setToken(access_token);
          localStorage.setItem('accessToken', access_token);
          console.log('Login successful. Token set. useEffect should now update state.');

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
    