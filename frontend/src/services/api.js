import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 65000, // slightly above backend 55s timeout
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ── Dashboard stats
export const getStats = () => api.get('/test-cases/stats').then(r => r.data);

// ── Projects
export const getProjects = () => api.get('/projects').then(r => r.data);
export const createProject = (data) => api.post('/projects', data).then(r => r.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then(r => r.data);

// ── Requirements / Generation
export const generateTestCases = (data) => api.post('/requirements/generate', data).then(r => r.data);
export const getRequirements = () => api.get('/requirements').then(r => r.data);
export const getRequirement = (id) => api.get(`/requirements/${id}`).then(r => r.data);

// ── Test Cases
export const getTestCases = (params) => api.get('/test-cases', { params }).then(r => r.data);
export const getTestCase = (id) => api.get(`/test-cases/${id}`).then(r => r.data);
export const updateTestCase = (id, data) => api.put(`/test-cases/${id}`, data).then(r => r.data);
export const patchTestCase = (id, data) => api.patch(`/test-cases/${id}`, data).then(r => r.data);
export const deleteTestCase = (id) => api.delete(`/test-cases/${id}`).then(r => r.data);

// ── History
export const getHistory = () => api.get('/history').then(r => r.data);
export const getHistoryItem = (id) => api.get(`/history/${id}`).then(r => r.data);
export const deleteHistory = (id) => api.delete(`/history/${id}`).then(r => r.data);

// ── AI — Primary endpoints
export const getAiStatus = () => api.get('/ai/status').then(r => r.data);
export const analyzeRequirement = (data) => api.post('/ai/analyze-requirement', data).then(r => r.data);
export const improveTestCases = (data) => api.post('/ai/improve-test-cases', data).then(r => r.data);
export const aiChat = (message, context) => api.post('/ai/chat', { message, context }).then(r => r.data);

// ── Export — these are direct downloads
export const exportUrl = (format, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return `/api/export/${format}${qs ? '?' + qs : ''}`;
};

export const exportPdfData = (params) => api.get('/export/pdf-data', { params }).then(r => r.data);

export default api;
