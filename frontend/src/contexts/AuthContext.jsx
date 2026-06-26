import React, { createContext, useState, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('clinica_usuario');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((userData) => {
    setUsuario(userData);
    localStorage.setItem('clinica_usuario', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem('clinica_usuario');
  }, []);

  const value = {
    usuario,
    login,
    logout,
    isAuthenticated: !!usuario,
    rol: usuario?.rol || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
