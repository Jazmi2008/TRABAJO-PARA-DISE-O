import React from 'react';

export function CitaCard({ cita, onCancelar, onCompletar, onVerDetalle, onModificar, showActions = false, showDetalle = false, showModificar = false }) {
  const estadoClass = {
    'AGENDADA': 'badge-agendada',
    'MODIFICADA': 'badge-modificada',
    'CANCELADA': 'badge-cancelada',
    'COMPLETADA': 'badge-completada'
  }[cita.estado] || 'badge-agendada';

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <span className={`badge ${estadoClass}`}>{cita.estado}</span>
          <h3 style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
            {cita.detalles}
          </h3>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
            {new Date(cita.fecha_hora).toLocaleString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div style={{ textAlign: 'right', minWidth: '200px' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Paciente:</strong> {cita.paciente?.nombre}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Doctor:</strong> {cita.doctor?.nombre}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Tipo:</strong> {cita.tipo}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>ID:</strong> {cita.id_cita}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {showDetalle && (
          <button onClick={() => onVerDetalle?.(cita)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Ver Detalle
          </button>
        )}
        {showModificar && cita.estado === 'AGENDADA' && (
          <button onClick={() => onModificar?.(cita)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Modificar
          </button>
        )}
        {showActions && cita.estado === 'AGENDADA' && (
          <>
            {onCompletar && (
              <button onClick={() => onCompletar(cita.id_cita)} className="btn btn-success" style={{ fontSize: '0.85rem' }}>
                Completar
              </button>
            )}
            {onCancelar && (
              <button onClick={() => onCancelar(cita.id_cita)} className="btn btn-danger" style={{ fontSize: '0.85rem' }}>
                Cancelar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
