import { useState, useCallback } from 'react';
import { usuarioService } from '../services/usuarioService';

export function useAgenda() {
  const [agenda, setAgenda] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarAgenda = useCallback(async (doctorId) => {
    setLoading(true);
    try {
      const data = await usuarioService.obtenerAgenda(doctorId);
      setAgenda(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar agenda');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarSlotsLibres = useCallback(async (doctorId) => {
    setLoading(true);
    try {
      const data = await usuarioService.slotsLibres(doctorId);
      setSlots(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar slots');
    } finally {
      setLoading(false);
    }
  }, []);

  const generarAgenda = useCallback(async (doctorId, dias = 7) => {
    setLoading(true);
    try {
      const data = await usuarioService.generarAgenda(doctorId, dias);
      setAgenda(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al generar agenda');
    } finally {
      setLoading(false);
    }
  }, []);

  return { agenda, slots, loading, error, cargarAgenda, cargarSlotsLibres, generarAgenda };
}
