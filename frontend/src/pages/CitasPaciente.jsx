import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCitasPorPaciente } from '../hooks/useCitas';
import { citaService } from '../services/citaService';
import { CitaCard } from '../components/CitaCard';
import { CitaDetalleModal } from '../components/CitaDetalleModal';

export function CitasPaciente() {
  const { usuario } = useAuth();
  const { citas, loading, refetch } = useCitasPorPaciente(usuario.id);
  const [citaDetalle, setCitaDetalle] = useState(null);

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

  const citasOrdenadas = [...citas].sort(
    (a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora)
  );

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Mis Citas</h1>

      {loading ? (
        <div className="loading">Cargando citas...</div>
      ) : citasOrdenadas.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes citas registradas</h3>
          <p>Aun no tienes citas agendadas en el sistema.</p>
        </div>
      ) : (
        citasOrdenadas.map(cita => (
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
