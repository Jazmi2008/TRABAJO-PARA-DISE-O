import { useState, useCallback } from 'react';
import { usuarioService } from '../services/usuarioService';

export function useHistorial(pacienteId) {
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarHistorial = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const data = await usuarioService.obtenerHistorialPaciente(pacienteId);
      setHistorial(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  const agregarItem = useCallback(async (tipo, valor) => {
    if (!pacienteId || !valor.trim()) return;
    setLoading(true);
    try {
      const data = {};
      data[tipo] = valor.trim();
      const res = await usuarioService.actualizarHistorialPaciente(pacienteId, data);
      setHistorial(res.historial);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar historial');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  return { historial, loading, error, cargarHistorial, agregarItem };
}
