import React, { useState } from 'react';
import { useTodasLasCitas, useBuscarCitas } from '../hooks/useCitas';
import { citaService } from '../services/citaService';
import { CitaCard } from '../components/CitaCard';
import { CitaDetalleModal } from '../components/CitaDetalleModal';
import { ModificarCitaModal } from '../components/ModificarCitaModal';

export function CitasRecepcionista() {
  const { citas: todasLasCitas, loading: loadingTodas, refetch: refetchTodas } = useTodasLasCitas();
  const { citas: citasBusqueda, loading: loadingBusqueda, buscar } = useBuscarCitas();

  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaFecha, setBusquedaFecha] = useState('');
  const [busquedaId, setBusquedaId] = useState('');
  const [modoBusqueda, setModoBusqueda] = useState(false);

  const [citaDetalle, setCitaDetalle] = useState(null);
  const [citaModificar, setCitaModificar] = useState(null);

  const citas = modoBusqueda ? citasBusqueda : todasLasCitas;
  const loading = modoBusqueda ? loadingBusqueda : loadingTodas;

  const citasFiltradas = filtroEstado === 'TODAS'
    ? citas
    : citas.filter(c => c.estado === filtroEstado);

  const handleBuscar = async () => {
    const params = {};
    if (busquedaNombre.trim()) params.nombre = busquedaNombre.trim();
    if (busquedaFecha) params.fecha = busquedaFecha;
    if (busquedaId.trim()) params.id_cita = busquedaId.trim();

    if (Object.keys(params).length > 0) {
      setModoBusqueda(true);
      await buscar(params);
    } else {
      setModoBusqueda(false);
    }
  };

  const handleLimpiarBusqueda = () => {
    setBusquedaNombre('');
    setBusquedaFecha('');
    setBusquedaId('');
    setModoBusqueda(false);
    setFiltroEstado('TODAS');
  };

  const handleCancelar = async (idCita) => {
    if (!confirm('Estas seguro de cancelar esta cita?')) return;
    try {
      await citaService.cancelarCita(idCita);
      refetchTodas();
      if (modoBusqueda) handleBuscar();
    } catch (err) {
      alert('Error al cancelar: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCompletar = async (idCita) => {
    try {
      await citaService.completarCita(idCita);
      refetchTodas();
      if (modoBusqueda) handleBuscar();
    } catch (err) {
      alert('Error al completar: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleModificado = () => {
    refetchTodas();
    if (modoBusqueda) handleBuscar();
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Todas las Citas del Sistema</h1>

      {/* Barra de busqueda */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">Buscar Citas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Nombre del Paciente</label>
            <input
              type="text"
              value={busquedaNombre}
              onChange={(e) => setBusquedaNombre(e.target.value)}
              placeholder="Ej: Juan Perez"
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Fecha</label>
            <input
              type="date"
              value={busquedaFecha}
              onChange={(e) => setBusquedaFecha(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>ID de Cita</label>
            <input
              type="text"
              value={busquedaId}
              onChange={(e) => setBusquedaId(e.target.value)}
              placeholder="Ej: C-001"
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleBuscar} className="btn btn-primary">
            Buscar
          </button>
          <button onClick={handleLimpiarBusqueda} className="btn btn-secondary">
            Limpiar
          </button>
        </div>
      </div>

      {/* Filtros por estado */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>Filtrar:</span>
          {['TODAS', 'AGENDADA', 'MODIFICADA', 'COMPLETADA', 'CANCELADA'].map(estado => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className="btn"
              style={{
                background: filtroEstado === estado ? '#2563eb' : '#e2e8f0',
                color: filtroEstado === estado ? 'white' : '#475569',
                fontSize: '0.8rem',
                padding: '0.4rem 0.8rem'
              }}
            >
              {estado === 'TODAS' ? 'Todas' : estado}
            </button>
          ))}
          {modoBusqueda && (
            <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#2563eb' }}>
              Resultados de busqueda
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando citas...</div>
      ) : citasFiltradas.length === 0 ? (
        <div className="empty-state">
          <h3>No hay citas</h3>
          <p>No se encontraron citas con los filtros seleccionados.</p>
        </div>
      ) : (
        citasFiltradas.map(cita => (
          <CitaCard
            key={cita.id_cita}
            cita={cita}
            onCancelar={handleCancelar}
            onCompletar={handleCompletar}
            onVerDetalle={setCitaDetalle}
            onModificar={setCitaModificar}
            showActions={cita.estado === 'AGENDADA' || cita.estado === 'MODIFICADA'}
            showDetalle={true}
            showModificar={cita.estado === 'AGENDADA'}
          />
        ))
      )}

      {/* Modales */}
      {citaDetalle && (
        <CitaDetalleModal
          cita={citaDetalle}
          onClose={() => setCitaDetalle(null)}
          onCancelar={handleCancelar}
          showCancelar={citaDetalle.estado === 'AGENDADA'}
        />
      )}
      {citaModificar && (
        <ModificarCitaModal
          cita={citaModificar}
          onClose={() => setCitaModificar(null)}
          onModificado={handleModificado}
        />
      )}
    </div>
  );
}
