import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCitasPorPaciente, useCitasPorDoctor } from '../hooks/useCitas';
import { CitaCard } from '../components/CitaCard';

export function Dashboard() {
  const { usuario, rol } = useAuth();

  const { citas: citasPaciente, loading: loadingP } = useCitasPorPaciente(
    rol === 'PACIENTE' ? usuario.id : null
  );
  const { citas: citasDoctor, loading: loadingD } = useCitasPorDoctor(
    rol === 'DOCTOR' ? usuario.id : null
  );

  const citas = rol === 'PACIENTE' ? citasPaciente : citasDoctor;
  const loading = rol === 'PACIENTE' ? loadingP : loadingD;

  const stats = {
    total: citas.length,
    agendadas: citas.filter(c => c.estado === 'AGENDADA').length,
    completadas: citas.filter(c => c.estado === 'COMPLETADA').length,
    canceladas: citas.filter(c => c.estado === 'CANCELADA').length
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>
        Bienvenido, {usuario.nombre}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>{stats.total}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Citas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{stats.agendadas}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Agendadas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>{stats.completadas}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Completadas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>{stats.canceladas}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Canceladas</div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Mis Citas Recientes</h2>
      {loading ? (
        <div className="loading">Cargando...</div>
      ) : citas.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes citas</h3>
          <p>Las citas que agendes apareceran aqui.</p>
        </div>
      ) : (
        citas.slice(0, 5).map(cita => (
          <CitaCard key={cita.id_cita} cita={cita} />
        ))
      )}
    </div>
  );
}
