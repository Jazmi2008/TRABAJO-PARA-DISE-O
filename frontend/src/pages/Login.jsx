import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const usuario = await authService.login(email, password);
      login(usuario);

      // Redirigir segun rol
      switch (usuario.rol) {
        case 'DOCTOR':
          navigate('/dashboard-doctor');
          break;
        case 'RECEPCIONISTA':
          navigate('/dashboard-recepcionista');
          break;
        default:
          navigate('/dashboard-paciente');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Clinica</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Sistema de Gestion de Citas Medicas
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesion'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280' }}>
          <p><strong>Cuentas de prueba:</strong></p>
          <p>Recepcionista: recepcion@clinica.com / recepcion123</p>
          <p>Paciente: juan.perez@email.com / paciente123</p>
          <p>Doctor: carlos.mendez@clinica.com / doctor123</p>
        </div>
      </div>
    </div>
  );
}
