import React from 'react';

export function HistorialMedicoCard({ historial }) {
  if (!historial) {
    return (
      <div className="card">
        <h3 className="card-title">Historial Medico</h3>
        <p style={{ color: '#6b7280' }}>No hay historial disponible.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title">Historial Medico</h3>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
        ID: {historial.id_historial}
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#374151' }}>
          Diagnosticos ({historial.diagnosticos?.length || 0})
        </h4>
        {historial.diagnosticos?.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#4b5563' }}>
            {historial.diagnosticos.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Sin diagnosticos registrados</p>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#374151' }}>
          Alergias ({historial.alergias?.length || 0})
        </h4>
        {historial.alergias?.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#4b5563' }}>
            {historial.alergias.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Sin alergias registradas</p>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#374151' }}>
          Medicamentos ({historial.medicamentos?.length || 0})
        </h4>
        {historial.medicamentos?.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#4b5563' }}>
            {historial.medicamentos.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Sin medicamentos registrados</p>
        )}
      </div>
    </div>
  );
}
