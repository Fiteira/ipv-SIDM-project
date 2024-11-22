// AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextData {
  userRole: string | null;
  setUserRole: (role: string) => void;
}

export const AuthContext = createContext<AuthContextData>({
  userRole: null,
  setUserRole: (userRole) => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      const storedUserRole = await AsyncStorage.getItem('userRole');
      console.log('Stored user role:', storedUserRole);
      if (storedUserRole) {
        setUserRole(storedUserRole);
      }
    };
    loadUserRole();
  }, []);

  return (
    <AuthContext.Provider value={{ userRole, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};