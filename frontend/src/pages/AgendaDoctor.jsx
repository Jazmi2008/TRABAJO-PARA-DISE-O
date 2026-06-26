import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAgenda } from '../hooks/useAgenda';

export function AgendaDoctor() {
  const { usuario } = useAuth();
  const { agenda, slots, cargarAgenda, cargarSlotsLibres, generarAgenda, loading } = useAgenda();
  const [dias, setDias] = useState(7);

  React.useEffect(() => {
    if (usuario?.id) {
      cargarAgenda(usuario.id).catch(() => {});
    }
  }, [usuario, cargarAgenda]);

  const handleGenerar = async () => {
    try {
      await generarAgenda(usuario.id, dias);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const allSlots = agenda?.slots || [];

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Mi Agenda</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Dias a generar</label>
            <input
              type="number"
              value={dias}
              onChange={(e) => setDias(parseInt(e.target.value) || 1)}
              min={1}
              max={30}
            />
          </div>
          <button onClick={handleGenerar} className="btn btn-primary">
            Generar Agenda
          </button>
          <button
            onClick={() => cargarSlotsLibres(usuario.id)}
            className="btn btn-secondary"
          >
            Ver Slots Libres
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando agenda...</div>
      ) : allSlots.length === 0 ? (
        <div className="empty-state">
          <h3>Agenda vacia</h3>
          <p>Genera slots para empezar a recibir citas.</p>
        </div>
      ) : (
        <div className="card">
          <h3 className="card-title">Slots ({allSlots.length})</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Duracion</th>
                  <th>Estado</th>
                  <th>Version</th>
                </tr>
              </thead>
              <tbody>
                {allSlots.map(slot => (
                  <tr key={slot.id_slot}>
                    <td>
                      {new Date(slot.fecha_hora).toLocaleString('es-ES')}
                    </td>
                    <td>{slot.duracion_minutos} min</td>
                    <td>
                      <span className={`badge badge-${slot.estado.toLowerCase()}`}>
                        {slot.estado}
                      </span>
                    </td>
                    <td>{slot.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
