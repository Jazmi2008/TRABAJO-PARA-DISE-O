import api from './api';

export const citaService = {
  crearCita: async (data) => {
    const res = await api.post('/citas/', data);
    return res.data.cita;
  },

  obtenerTodasLasCitas: async () => {
    const res = await api.get('/citas/todas');
    return res.data.citas;
  },

  buscarCitas: async (params) => {
    const res = await api.get('/citas/buscar', { params });
    return res.data.citas;
  },

  obtenerCita: async (id) => {
    const res = await api.get(`/citas/${id}`);
    return res.data.cita;
  },

  modificarCita: async (idCita, data) => {
    const res = await api.put(`/citas/${idCita}/modificar`, data);
    return res.data;
  },

  citasPorPaciente: async (pacienteId) => {
    const res = await api.get(`/citas/paciente/${pacienteId}`);
    return res.data.citas;
  },

  citasPorDoctor: async (doctorId) => {
    const res = await api.get(`/citas/doctor/${doctorId}`);
    return res.data.citas;
  },

  modificarFecha: async (idCita, nuevaFecha, versionSlot) => {
    const res = await api.put(`/citas/${idCita}/fecha`, {
      nueva_fecha: nuevaFecha,
      version_slot: versionSlot
    });
    return res.data;
  },

  cancelarCita: async (idCita) => {
    const res = await api.put(`/citas/${idCita}/cancelar`);
    return res.data;
  },

  completarCita: async (idCita) => {
    const res = await api.put(`/citas/${idCita}/completar`);
    return res.data;
  }
};
