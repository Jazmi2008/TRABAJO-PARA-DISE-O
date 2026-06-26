import { useState, useEffect } from 'react';
import { usuarioService } from '../services/usuarioService';

export function useDoctores() {
  const [doctores, setDoctores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await usuarioService.listarDoctores();
        setDoctores(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al cargar doctores');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { doctores, loading, error };
}
