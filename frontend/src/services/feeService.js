import api from './api';

const feeService = {
  getAll: async () => {
    const response = await api.get('/fees');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/fees/${id}`);
    return response.data;
  },

  create: async (feeData) => {
    const response = await api.post('/fees', feeData);
    return response.data;
  },

  update: async (id, feeData) => {
    const response = await api.put(`/fees/${id}`, feeData);
    return response.data;
  },

  collectPayment: async (id, paymentData) => {
    // paymentData: { amount, method }
    const response = await api.post(`/fees/${id}/payments`, paymentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/fees/${id}`);
    return response.data;
  },
};

export default feeService;
