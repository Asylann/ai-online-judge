import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Automatically attach JWT token on EVERY Axios request across the entire frontend app.
// This guarantees that even on instant F5 refresh before React useEffects settle,
// the Authorization header is reliably present.
if (typeof window !== "undefined") {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  authReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  authReady: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user_info");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("jwt_token");
      if (savedToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        return savedToken;
      }
    }
    return null;
  });

  const [authReady, setAuthReady] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("jwt_token");
    const savedUser = localStorage.getItem("user_info");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      } catch (e) {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("user_info");
      }
    }
    setAuthReady(true);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("jwt_token", newToken);
    localStorage.setItem("user_info", JSON.stringify(newUser));
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_info");
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        authReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
