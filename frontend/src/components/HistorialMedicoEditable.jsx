import React, { useState } from 'react';
import { useHistorial } from '../hooks/useHistorial';

export function HistorialMedicoEditable({ pacienteId }) {
  const { historial, loading, error, cargarHistorial, agregarItem } = useHistorial(pacienteId);
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState('');
  const [nuevaAlergia, setNuevaAlergia] = useState('');
  const [nuevoMedicamento, setNuevoMedicamento] = useState('');

  React.useEffect(() => {
    cargarHistorial();
  }, [pacienteId, cargarHistorial]);

  const handleAgregar = async (tipo, valor, setValor) => {
    if (!valor.trim()) return;
    await agregarItem(tipo, valor);
    setValor('');
  };

  if (loading && !historial) return <div className="loading">Cargando historial...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!historial) return <div className="empty-state"><h3>Sin historial</h3></div>;

  return (
    <div className="card">
      <h3 className="card-title">Historial Medico del Paciente</h3>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
        ID: {historial.id_historial}
      </p>

      {/* Diagnosticos */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#374151' }}>
          Diagnosticos ({historial.diagnosticos?.length || 0})
        </h4>
        {historial.diagnosticos?.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
            {historial.diagnosticos.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Sin diagnosticos</p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={nuevoDiagnostico}
            onChange={(e) => setNuevoDiagnostico(e.target.value)}
            placeholder="Nuevo diagnostico..."
            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <button
            onClick={() => handleAgregar('diagnostico', nuevoDiagnostico, setNuevoDiagnostico)}
            className="btn btn-success"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            disabled={loading}
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Alergias */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#374151' }}>
          Alergias ({historial.alergias?.length || 0})
        </h4>
        {historial.alergias?.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
            {historial.alergias.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Sin alergias</p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={nuevaAlergia}
            onChange={(e) => setNuevaAlergia(e.target.value)}
            placeholder="Nueva alergia..."
            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <button
            onClick={() => handleAgregar('alergia', nuevaAlergia, setNuevaAlergia)}
            className="btn btn-success"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            disabled={loading}
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Medicamentos */}
      <div>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#374151' }}>
          Medicamentos ({historial.medicamentos?.length || 0})
        </h4>
        {historial.medicamentos?.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
            {historial.medicamentos.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Sin medicamentos</p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={nuevoMedicamento}
            onChange={(e) => setNuevoMedicamento(e.target.value)}
            placeholder="Nuevo medicamento..."
            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <button
            onClick={() => handleAgregar('medicamento', nuevoMedicamento, setNuevoMedicamento)}
            className="btn btn-success"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            disabled={loading}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
