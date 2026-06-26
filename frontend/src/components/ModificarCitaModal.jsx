import React, { useState, useEffect } from 'react';
import { useDoctores } from '../hooks/useDoctores';
import { useAgenda } from '../hooks/useAgenda';
import { citaService } from '../services/citaService';

export function ModificarCitaModal({ cita, onClose, onModificado }) {
  const { doctores } = useDoctores();
  const { slots, cargarSlotsLibres, generarAgenda } = useAgenda();

  const [doctorId, setDoctorId] = useState(cita?.doctor?.id || '');
  const [slotId, setSlotId] = useState('');
  const [tipo, setTipo] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (doctorId && doctorId !== cita?.doctor?.id) {
      cargarSlotsLibres(doctorId).catch(() => {
        generarAgenda(doctorId, 2).then(() => cargarSlotsLibres(doctorId));
      });
    } else if (cita?.doctor?.id) {
      cargarSlotsLibres(cita.doctor.id).catch(() => {});
    }
  }, [doctorId, cita]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {};
      if (doctorId && doctorId !== cita.doctor.id) data.doctor_id = doctorId;
      if (slotId) data.slot_id = slotId;
      if (tipo) data.tipo = tipo;

      await citaService.modificarCita(cita.id_cita, data);
      onModificado?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al modificar cita');
    } finally {
      setLoading(false);
    }
  };

  if (!cita) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Modificar Cita</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280'
          }}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Cita actual</label>
            <div style={{
              padding: '0.75rem',
              background: '#f3f4f6',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              {cita.detalles} - {new Date(cita.fecha_hora).toLocaleString('es-ES')}
            </div>
          </div>

          <div className="form-group">
            <label>Cambiar Doctor (opcional)</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value={cita.doctor.id}>Mantener: {cita.doctor.nombre}</option>
              {doctores.filter(d => d.id !== cita.doctor.id).map(d => (
                <option key={d.id} value={d.id}>{d.nombre} - {d.especialidad}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Cambiar Horario (opcional)</label>
            <select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
              <option value="">Mantener horario actual</option>
              {slots.map(s => (
                <option key={s.id_slot} value={s.id_slot}>
                  {new Date(s.fecha_hora).toLocaleString('es-ES')} - {s.duracion_minutos}min
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Cambiar Tipo (opcional)</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="general">Consulta General</option>
              <option value="laboratorio">Laboratorio</option>
              <option value="telemedicina">Telemedicina</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
