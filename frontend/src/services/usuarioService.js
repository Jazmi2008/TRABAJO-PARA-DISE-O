import api from './api';

export const usuarioService = {
  listarDoctores: async () => {
    const res = await api.get('/usuarios/doctores');
    return res.data.doctores;
  },

  listarPacientes: async () => {
    const res = await api.get('/usuarios/pacientes');
    return res.data.pacientes;
  },

  obtenerHistorialPaciente: async (pacienteId) => {
    const res = await api.get(`/usuarios/pacientes/${pacienteId}/historial`);
    return res.data.historial;
  },

  actualizarHistorialPaciente: async (pacienteId, data) => {
    const res = await api.put(`/usuarios/pacientes/${pacienteId}/historial`, data);
    return res.data;
  },

  generarAgenda: async (doctorId, dias = 7) => {
    const res = await api.post(`/usuarios/${doctorId}/agenda/generar?dias=${dias}`);
    return res.data.agenda;
  },

  obtenerAgenda: async (doctorId) => {
    const res = await api.get(`/usuarios/${doctorId}/agenda`);
    return res.data.agenda;
  },

  slotsLibres: async (doctorId) => {
    const res = await api.get(`/usuarios/${doctorId}/agenda/slots-libres`);
    return res.data.slots;
  }
};
