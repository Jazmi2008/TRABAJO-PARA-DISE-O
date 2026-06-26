import React, { useState } from 'react';
import { useDoctores } from '../hooks/useDoctores';
import { useAgenda } from '../hooks/useAgenda';
import { SlotSelector } from '../components/SlotSelector';
import { citaService } from '../services/citaService';
import { usuarioService } from '../services/usuarioService';

export function AgendarCita() {
  const { doctores, loading: loadingDoctores } = useDoctores();
  const { agenda, generarAgenda, loading: loadingAgenda } = useAgenda();

  const [pacienteId, setPacienteId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [tipo, setTipo] = useState('general');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    const cargarPacientes = async () => {
      try {
        const data = await usuarioService.listarPacientes();
        setPacientes(data);
      } catch (err) {
        console.error('Error cargando pacientes:', err);
      }
    };
    cargarPacientes();
  }, []);

  const handleDoctorChange = async (id) => {
    setDoctorId(id);
    setSelectedSlot(null);
    if (id) {
      try {
        await generarAgenda(id, 2);
      } catch (err) {
        console.log('Agenda ya existe o error:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!selectedSlot) {
      setError('Selecciona un horario');
      return;
    }

    try {
      const cita = await citaService.crearCita({
        paciente_id: pacienteId,
        doctor_id: doctorId,
        slot_id: selectedSlot.id_slot,
        tipo: tipo
      });
      setMensaje(`Cita agendada exitosamente: ${cita.id_cita}`);
      setPacienteId('');
      setDoctorId('');
      setSelectedSlot(null);
      setTipo('general');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agendar cita');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Agendar Nueva Cita</h1>

      {mensaje && <div className="success-message">{mensaje}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Datos de la Cita</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Paciente</label>
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                required
              >
                <option value="">Seleccionar paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.email})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Doctor</label>
              <select
                value={doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                required
              >
                <option value="">Seleccionar doctor...</option>
                {doctores.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} - {d.especialidad}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Cita</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="general">Consulta General</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="telemedicina">Telemedicina</option>
              </select>
            </div>

            {selectedSlot && (
              <div className="form-group">
                <label>Horario Seleccionado</label>
                <div style={{
                  padding: '0.75rem',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  {new Date(selectedSlot.fecha_hora).toLocaleString('es-ES')}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={!selectedSlot || !pacienteId || !doctorId}
            >
              Agendar Cita
            </button>
          </form>
        </div>

        <div>
          {doctorId && (
            <SlotSelector
              doctorId={doctorId}
              onSelect={setSelectedSlot}
            />
          )}
          {!doctorId && (
            <div className="card empty-state">
              <h3>Selecciona un doctor</h3>
              <p>Para ver los horarios disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
