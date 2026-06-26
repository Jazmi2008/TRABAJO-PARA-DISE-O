import { useState, useEffect, useCallback } from 'react';
import { citaService } from '../services/citaService';

export function useCitasPorPaciente(pacienteId) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCitas = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const data = await citaService.citasPorPaciente(pacienteId);
      setCitas(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  return { citas, loading, error, refetch: fetchCitas };
}

export function useCitasPorDoctor(doctorId) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCitas = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const data = await citaService.citasPorDoctor(doctorId);
      setCitas(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  return { citas, loading, error, refetch: fetchCitas };
}

export function useTodasLasCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await citaService.obtenerTodasLasCitas();
      setCitas(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  return { citas, loading, error, refetch: fetchCitas };
}

export function useBuscarCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buscar = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await citaService.buscarCitas(params);
      setCitas(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al buscar citas');
    } finally {
      setLoading(false);
    }
  }, []);

  return { citas, loading, error, buscar };
}
