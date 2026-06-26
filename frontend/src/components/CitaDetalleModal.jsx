import React from 'react';

export function CitaDetalleModal({ cita, onClose, onCancelar, showCancelar = false }) {
  if (!cita) return null;

  const estadoClass = {
    'AGENDADA': 'badge-agendada',
    'MODIFICADA': 'badge-modificada',
    'CANCELADA': 'badge-cancelada',
    'COMPLETADA': 'badge-completada'
  }[cita.estado] || 'badge-agendada';

  const detallesEspecificos = () => {
    if (cita.tipo === 'ConsultaGeneral') {
      return <p><strong>Consultorio:</strong> {cita.nro_consultorio}</p>;
    }
    if (cita.tipo === 'CitaLaboratorio') {
      return (
        <>
          <p><strong>Tipo de Analisis:</strong> {cita.tipo_analisis}</p>
          <p><strong>Requiere Ayuno:</strong> {cita.requiere_ayuno ? 'Si' : 'No'}</p>
        </>
      );
    }
    if (cita.tipo === 'CitaTelemedicina') {
      return (
        <>
          <p><strong>Plataforma:</strong> {cita.url_plataforma}</p>
          <p><strong>Link de Acceso:</strong> <a href={cita.link_acceso} target="_blank" rel="noopener">{cita.link_acceso}</a></p>
        </>
      );
    }
    return null;
  };

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
          <h2 style={{ margin: 0 }}>Detalle de Cita</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280'
          }}>×</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <span className={`badge ${estadoClass}`}>{cita.estado}</span>
        </div>

        <div style={{ lineHeight: '1.8' }}>
          <p><strong>ID:</strong> {cita.id_cita}</p>
          <p><strong>Tipo:</strong> {cita.tipo}</p>
          <p><strong>Detalles:</strong> {cita.detalles}</p>
          <p><strong>Fecha y Hora:</strong> {new Date(cita.fecha_hora).toLocaleString('es-ES')}</p>
          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <p><strong>Paciente:</strong> {cita.paciente?.nombre}</p>
          <p><strong>Email Paciente:</strong> {cita.paciente?.email}</p>
          <p><strong>Telefono:</strong> {cita.paciente?.telefono || 'No registrado'}</p>
          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <p><strong>Doctor:</strong> {cita.doctor?.nombre}</p>
          <p><strong>Especialidad:</strong> {cita.doctor?.especialidad || 'N/A'}</p>
          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          {detallesEspecificos()}
          <p><strong>Slot ID:</strong> {cita.slot_id}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
          {showCancelar && cita.estado === 'AGENDADA' && (
            <button
              onClick={() => {
                if (confirm('Estas seguro de cancelar esta cita?')) {
                  onCancelar?.(cita.id_cita);
                }
              }}
              className="btn btn-danger"
              style={{ flex: 1 }}
            >
              Cancelar Cita
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
