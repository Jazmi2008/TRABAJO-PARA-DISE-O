import api from './api';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.usuario;
  },

  register: async (data) => {
    const res = await api.post('/auth/registro', data);
    return res.data;
  },

  getUsuarios: async () => {
    const res = await api.get('/auth/usuarios');
    return res.data.usuarios;
  }
};
