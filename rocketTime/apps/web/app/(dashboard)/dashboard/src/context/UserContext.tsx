import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Updated User interface
interface User {
    id: string;         // Keep the ID
    email: string;      // Keep the email
    first_name?: string; // Add first_name as optional
    last_name?: string;  // Add last_name as optional
    // Remove 'name' and 'coins' if they aren't directly fetched
    // by the /auth/user endpoint. Add them back if they are.
  }

// Define what the context will provide
interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create the Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start in a loading state

  useEffect(() => {
    // This effect runs once when the app loads
    const fetchUserData = async () => {
      try {
        // Use 'credentials: include' to send the session cookie
        const res = await fetch(`${API_URL}/auth/me?ts=${Date.now()}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        
        if (res.ok) {
          const payload = await res.json();
          const userData = payload?.user ?? payload ?? null;
          setUser(userData);
          setIsAuthenticated(Boolean(userData));
        } else {
          // Not authenticated
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // We're done loading, whether we succeeded or failed
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []); // Empty dependency array so it only runs once

  return (
    <UserContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
