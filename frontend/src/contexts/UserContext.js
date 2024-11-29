import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../api";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("Checking authentication...");
    const token = localStorage.getItem("token");
    console.log("Token exists:", token);

    if (token) {
      try {
        console.log("Fetching user data...");
        const userData = await authAPI.getCurrentUser();
        console.log("User data received:", userData);
        setUser(userData);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    localStorage.setItem("token", response.token);
    setUser(response.user);
    return response;
  };

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    localStorage.setItem("token", response.token);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <UserContext.Provider
      value={{ user, setUser, login, logout, loading, register }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;
