import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export function Layout({ children }) {
  const { usuario, logout, isAuthenticated, rol } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (rol) {
      case 'DOCTOR': return '/dashboard-doctor';
      case 'RECEPCIONISTA': return '/dashboard-recepcionista';
      default: return '/dashboard-paciente';
    }
  };

  const getCitasLink = () => {
    switch (rol) {
      case 'DOCTOR': return '/citas-doctor';
      case 'RECEPCIONISTA': return '/citas-recepcionista';
      default: return '/citas-paciente';
    }
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to={isAuthenticated ? getDashboardLink() : '/login'}>Clinica</Link>
        </div>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <span className="nav-user">
                {usuario.nombre} ({rol})
              </span>
              <Link to={getDashboardLink()}>Dashboard</Link>
              <Link to={getCitasLink()}>Citas</Link>
              {rol === 'RECEPCIONISTA' && (
                <Link to="/agendar">Agendar Cita</Link>
              )}
              {rol === 'DOCTOR' && (
                <Link to="/agenda">Mi Agenda</Link>
              )}
              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesion
              </button>
            </>
          ) : (
            <Link to="/login">Iniciar Sesion</Link>
          )}
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>Sistema de Gestion de Citas Medicas 2026</p>
      </footer>
    </div>
  );
}
