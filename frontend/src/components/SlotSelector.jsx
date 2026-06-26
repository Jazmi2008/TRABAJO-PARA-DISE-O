import React, { useState } from 'react';
import { useAgenda } from '../hooks/useAgenda';

export function SlotSelector({ doctorId, onSelect }) {
  const { slots, loading, error, cargarSlotsLibres } = useAgenda();
  const [selectedSlot, setSelectedSlot] = useState(null);

  React.useEffect(() => {
    if (doctorId) {
      cargarSlotsLibres(doctorId);
    }
  }, [doctorId, cargarSlotsLibres]);

  if (loading) return <div className="loading">Cargando slots...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (slots.length === 0) return (
    <div className="empty-state">
      <h3>No hay slots disponibles</h3>
      <p>Genere la agenda del doctor primero.</p>
    </div>
  );

  return (
    <div className="card">
      <h3 className="card-title">Seleccionar Horario</h3>
      <div className="grid-3">
        {slots.map((slot) => (
          <button
            key={slot.id_slot}
            onClick={() => {
              setSelectedSlot(slot);
              onSelect?.(slot);
            }}
            className="btn"
            style={{
              background: selectedSlot?.id_slot === slot.id_slot ? '#2563eb' : '#f3f4f6',
              color: selectedSlot?.id_slot === slot.id_slot ? 'white' : '#374151',
              textAlign: 'left',
              padding: '1rem'
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {new Date(slot.fecha_hora).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {new Date(slot.fecha_hora).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {slot.duracion_minutos} minutos
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
