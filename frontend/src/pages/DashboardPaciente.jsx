import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCitasPorPaciente } from '../hooks/useCitas';
import { citaService } from '../services/citaService';
import { CitaCard } from '../components/CitaCard';
import { CitaDetalleModal } from '../components/CitaDetalleModal';

export function DashboardPaciente() {
  const { usuario } = useAuth();
  const { citas, loading, refetch } = useCitasPorPaciente(usuario.id);
  const [citaDetalle, setCitaDetalle] = useState(null);

  const citasPendientes = citas.filter(c => c.estado === 'AGENDADA' || c.estado === 'MODIFICADA');
  const citasCompletadas = citas.filter(c => c.estado === 'COMPLETADA');
  const citasCanceladas = citas.filter(c => c.estado === 'CANCELADA');

  const proximaCita = citasPendientes
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0];

  const handleCancelar = async (idCita) => {
    if (!confirm('Estas seguro de cancelar esta cita?')) return;
    try {
      await citaService.cancelarCita(idCita);
      refetch();
      setCitaDetalle(null);
    } catch (err) {
      alert('Error al cancelar: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>
        Bienvenido, {usuario.nombre}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>{citas.length}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Citas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{citasPendientes.length}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pendientes</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>{citasCompletadas.length}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Completadas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>{citasCanceladas.length}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Canceladas</div>
        </div>
      </div>

      {proximaCita && (
        <div className="card" style={{ borderLeft: '4px solid #2563eb', marginBottom: '2rem' }}>
          <h3 className="card-title">Tu Proxima Cita</h3>
          <CitaCard
            cita={proximaCita}
            onVerDetalle={setCitaDetalle}
            showDetalle={true}
            showActions={false}
          />
        </div>
      )}

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
          <CitaCard
            key={cita.id_cita}
            cita={cita}
            onVerDetalle={setCitaDetalle}
            showDetalle={true}
            showActions={false}
          />
        ))
      )}

      {citaDetalle && (
        <CitaDetalleModal
          cita={citaDetalle}
          onClose={() => setCitaDetalle(null)}
          onCancelar={handleCancelar}
          showCancelar={citaDetalle.estado === 'AGENDADA'}
        />
      )}
    </div>
  );
}
