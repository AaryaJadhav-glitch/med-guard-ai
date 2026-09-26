const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(endpoint, { method = 'GET', body, token } = {}) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (data?.details ? data.details.map(d => d.message).join(', ') : 'API request failed');
    const err = new Error(errorMsg);
    err.status = response.status;
    err.details = data?.details;
    throw err;
  }

  return data;
}

export const api = {
  // Patients
  getPatients: (token, search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/patients${query}`, { token });
  },
  getPatient: (token, id) => request(`/api/patients/${id}`, { token }),
  createPatient: (token, payload) => request('/api/patients', { method: 'POST', body: payload, token }),
  updatePatient: (token, id, payload) => request(`/api/patients/${id}`, { method: 'PATCH', body: payload, token }),
  deletePatient: (token, id) => request(`/api/patients/${id}`, { method: 'DELETE', token }),
  seedDemoData: (token) => request('/api/patients/seed', { method: 'POST', token }),

  // Allergies
  getAllergies: (token, patientId) => request(`/api/patients/${patientId}/allergies`, { token }),
  createAllergy: (token, patientId, payload) => request(`/api/patients/${patientId}/allergies`, { method: 'POST', body: payload, token }),
  updateAllergy: (token, id, payload) => request(`/api/allergies/${id}`, { method: 'PATCH', body: payload, token }),
  deleteAllergy: (token, id) => request(`/api/allergies/${id}`, { method: 'DELETE', token }),

  // Conditions
  getConditions: (token, patientId) => request(`/api/patients/${patientId}/conditions`, { token }),
  createCondition: (token, patientId, payload) => request(`/api/patients/${patientId}/conditions`, { method: 'POST', body: payload, token }),
  updateCondition: (token, id, payload) => request(`/api/conditions/${id}`, { method: 'PATCH', body: payload, token }),
  deleteCondition: (token, id) => request(`/api/conditions/${id}`, { method: 'DELETE', token }),

  // Medications
  getMedications: (token, patientId, activeOnly = false) => {
    const query = activeOnly ? '?activeOnly=true' : '';
    return request(`/api/patients/${patientId}/medications${query}`, { token });
  },
  createMedication: (token, patientId, payload) => request(`/api/patients/${patientId}/medications`, { method: 'POST', body: payload, token }),
  updateMedication: (token, id, payload) => request(`/api/medications/${id}`, { method: 'PATCH', body: payload, token }),
  deleteMedication: (token, id) => request(`/api/medications/${id}`, { method: 'DELETE', token }),

  // AI Safety Analysis
  runAnalysis: (token, payload) => request('/api/analysis', { method: 'POST', body: payload, token }),
  getAnalyses: (token, { patientId = '', risk = '' } = {}) => {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (risk) params.append('risk', risk);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/analysis${queryString}`, { token });
  },
  getAnalysis: (token, id) => request(`/api/analysis/${id}`, { token }),

  // Profile & Dashboard
  getDashboardStats: (token) => request('/api/dashboard/stats', { token }),
  getProfile: (token) => request('/api/profile', { token }),
  updateProfile: (token, payload) => request('/api/profile', { method: 'PATCH', body: payload, token })
};
