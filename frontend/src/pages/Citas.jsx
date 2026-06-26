import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCitasPorPaciente, useCitasPorDoctor } from '../hooks/useCitas';
import { citaService } from '../services/citaService';
import { CitaCard } from '../components/CitaCard';

export function Citas() {
  const { usuario, rol } = useAuth();

  const { citas: citasPaciente, loading: loadingP, refetch: refetchP } = useCitasPorPaciente(
    rol === 'PACIENTE' ? usuario.id : null
  );
  const { citas: citasDoctor, loading: loadingD, refetch: refetchD } = useCitasPorDoctor(
    rol === 'DOCTOR' ? usuario.id : null
  );

  const citas = rol === 'PACIENTE' ? citasPaciente : citasDoctor;
  const loading = rol === 'PACIENTE' ? loadingP : loadingD;
  const refetch = rol === 'PACIENTE' ? refetchP : refetchD;

  const handleCancelar = async (idCita) => {
    if (!confirm('Estas seguro de cancelar esta cita?')) return;
    try {
      await citaService.cancelarCita(idCita);
      refetch();
    } catch (err) {
      alert('Error al cancelar: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCompletar = async (idCita) => {
    try {
      await citaService.completarCita(idCita);
      refetch();
    } catch (err) {
      alert('Error al completar: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Mis Citas</h1>

      {loading ? (
        <div className="loading">Cargando citas...</div>
      ) : citas.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes citas registradas</h3>
          <p>Aun no tienes citas agendadas en el sistema.</p>
        </div>
      ) : (
        citas.map(cita => (
          <CitaCard
            key={cita.id_cita}
            cita={cita}
            onCancelar={handleCancelar}
            onCompletar={handleCompletar}
            showActions={rol === 'DOCTOR' || rol === 'RECEPCIONISTA'}
          />
        ))
      )}
    </div>
  );
}
