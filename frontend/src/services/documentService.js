import api from './api';

const documentService = {
  getAll: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  generate: async (documentData) => {
    // documentData contains { studentId, documentType, purpose }
    const response = await api.post('/documents', documentData);
    return response.data;
  },

  update: async (id, documentData) => {
    const response = await api.put(`/documents/${id}`, documentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

export default documentService;
