import api from './api';

const marksService = {
  getAll: async () => {
    const response = await api.get('/marks');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/marks/${id}`);
    return response.data;
  },

  create: async (marksData) => {
    const response = await api.post('/marks', marksData);
    return response.data;
  },

  update: async (id, marksData) => {
    const response = await api.put(`/marks/${id}`, marksData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/marks/${id}`);
    return response.data;
  },
};

export default marksService;
