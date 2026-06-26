import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCitasPorDoctor } from '../hooks/useCitas';
import { citaService } from '../services/citaService';
import { CitaCard } from '../components/CitaCard';
import { HistorialMedicoEditable } from '../components/HistorialMedicoEditable';
import { CitaDetalleModal } from '../components/CitaDetalleModal';

export function DashboardDoctor() {
  const { usuario } = useAuth();
  const { citas, loading, refetch } = useCitasPorDoctor(usuario.id);
  const [citaExpandida, setCitaExpandida] = useState(null);
  const [citaDetalle, setCitaDetalle] = useState(null);

  const citasPendientes = citas.filter(c => c.estado === 'AGENDADA' || c.estado === 'MODIFICADA');
  const citasCompletadas = citas.filter(c => c.estado === 'COMPLETADA');
  const citasCanceladas = citas.filter(c => c.estado === 'CANCELADA');

  const handleCompletar = async (idCita) => {
    try {
      await citaService.completarCita(idCita);
      refetch();
      if (citaExpandida === idCita) setCitaExpandida(null);
    } catch (err) {
      alert('Error al completar: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>
        Bienvenido, Dr. {usuario.nombre}
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

      <div className="grid-2">
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Citas Asignadas</h2>
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : citas.length === 0 ? (
            <div className="empty-state">
              <h3>No tienes citas</h3>
              <p>Aun no tienes citas asignadas.</p>
            </div>
          ) : (
            citas.map(cita => (
              <div key={cita.id_cita}>
                <CitaCard
                  cita={cita}
                  onCompletar={handleCompletar}
                  onVerDetalle={setCitaDetalle}
                  showActions={cita.estado === 'AGENDADA'}
                  showDetalle={true}
                />
                <button
                  onClick={() => setCitaExpandida(citaExpandida === cita.id_cita ? null : cita.id_cita)}
                  className="btn btn-secondary"
                  style={{ marginTop: '-0.5rem', marginBottom: '1rem', width: '100%' }}
                >
                  {citaExpandida === cita.id_cita ? 'Ocultar Historial' : 'Ver / Editar Historial del Paciente'}
                </button>
                {citaExpandida === cita.id_cita && cita.paciente?.id && (
                  <HistorialMedicoEditable pacienteId={cita.paciente.id} />
                )}
              </div>
            ))
          )}
        </div>

        {citaDetalle && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Detalle de Cita</h2>
            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <h3 className="card-title">{citaDetalle.detalles}</h3>
              <p><strong>Paciente:</strong> {citaDetalle.paciente?.nombre}</p>
              <p><strong>Email:</strong> {citaDetalle.paciente?.email}</p>
              <p><strong>Telefono:</strong> {citaDetalle.paciente?.telefono || 'No registrado'}</p>
              <p><strong>Fecha:</strong> {new Date(citaDetalle.fecha_hora).toLocaleString('es-ES')}</p>
              <p><strong>Estado:</strong> <span className={`badge badge-${citaDetalle.estado.toLowerCase()}`}>{citaDetalle.estado}</span></p>
            </div>
          </div>
        )}
      </div>

      {citaDetalle && (
        <CitaDetalleModal
          cita={citaDetalle}
          onClose={() => setCitaDetalle(null)}
          showCancelar={false}
        />
      )}
    </div>
  );
}
