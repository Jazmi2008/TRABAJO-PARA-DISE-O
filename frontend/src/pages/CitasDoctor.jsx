import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCitasPorDoctor } from '../hooks/useCitas';
import { citaService } from '../services/citaService';
import { CitaCard } from '../components/CitaCard';
import { HistorialMedicoEditable } from '../components/HistorialMedicoEditable';
import { CitaDetalleModal } from '../components/CitaDetalleModal';

export function CitasDoctor() {
  const { usuario } = useAuth();
  const { citas, loading, refetch } = useCitasPorDoctor(usuario.id);
  const [citaExpandida, setCitaExpandida] = useState(null);
  const [citaDetalle, setCitaDetalle] = useState(null);

  const handleCompletar = async (idCita) => {
    try {
      await citaService.completarCita(idCita);
      refetch();
      if (citaExpandida === idCita) setCitaExpandida(null);
    } catch (err) {
      alert('Error al completar: ' + (err.response?.data?.detail || err.message));
    }
  };

  const citasOrdenadas = [...citas].sort(
    (a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora)
  );

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Citas Asignadas</h1>

      {loading ? (
        <div className="loading">Cargando citas...</div>
      ) : citasOrdenadas.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes citas asignadas</h3>
          <p>Aun no tienes citas programadas.</p>
        </div>
      ) : (
        citasOrdenadas.map(cita => (
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
