const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000/api/agents';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// --- Auth API ---
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// --- Inventory API ---
export const inventoryApi = {
  getAll: (params?: { blood_group?: string; component_type?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/inventory${query ? `?${query}` : ''}`);
  },
  getStats: () => fetchApi('/inventory/stats'),
  getById: (id: string) => fetchApi(`/inventory/unit/${id}`),
  addUnit: (data: any) => fetchApi('/inventory/unit', { method: 'POST', body: JSON.stringify(data) }),
  discardUnit: (id: string, reason: string) =>
    fetchApi(`/inventory/unit/${id}/discard`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  quarantineUnit: (id: string, reason: string) =>
    fetchApi(`/inventory/unit/${id}/quarantine`, { method: 'PUT', body: JSON.stringify({ reason }) }),
};

// --- Donors API ---
export const donorsApi = {
  getAll: (params?: { blood_group?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/donors${query ? `?${query}` : ''}`);
  },
  getById: (id: number) => fetchApi(`/donors/${id}`),
  create: (data: any) => fetchApi('/donors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/donors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/donors/${id}`, { method: 'DELETE' }),
};

// --- Patients API ---
export const patientsApi = {
  getAll: (params?: { blood_group?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/patients${query ? `?${query}` : ''}`);
  },
  getById: (id: number) => fetchApi(`/patients/${id}`),
  create: (data: any) => fetchApi('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/patients/${id}`, { method: 'DELETE' }),
};

// --- Requests API ---
export const requestsApi = {
  getAll: (params?: { status?: string; urgency?: string; blood_group?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/requests${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => fetchApi(`/requests/${id}`),
  create: (data: any) => fetchApi('/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, reason?: string) =>
    fetchApi(`/requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
  match: (id: string) => fetchApi(`/requests/${id}/match`),
  recordCrossmatch: (id: string, data: { unit_id: string; result: string }) =>
    fetchApi(`/requests/${id}/crossmatch`, { method: 'POST', body: JSON.stringify(data) }),
  reserve: (id: string, unit_id: string) =>
    fetchApi(`/requests/${id}/reserve`, { method: 'POST', body: JSON.stringify({ unit_id }) }),
  issue: (id: string, unit_id: string, reason_code?: string) =>
    fetchApi(`/requests/${id}/issue`, { method: 'POST', body: JSON.stringify({ unit_id, reason_code }) }),
  cancelReservation: (id: string, unitId: string) =>
    fetchApi(`/requests/${id}/reserve/${unitId}`, { method: 'DELETE' }),
  getAllReservations: (status?: string) =>
    fetchApi(`/requests/reservations/all${status ? `?status=${status}` : ''}`),
  getAllIssuances: () =>
    fetchApi('/requests/issuances/all'),
};

// --- Alerts API ---
export const alertsApi = {
  getAll: (params?: { status?: string; severity?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/alerts${query ? `?${query}` : ''}`);
  },
  acknowledge: (id: number) => fetchApi(`/alerts/${id}/acknowledge`, { method: 'PUT' }),
  resolve: (id: number) => fetchApi(`/alerts/${id}/resolve`, { method: 'PUT' }),
  dismiss: (id: number) => fetchApi(`/alerts/${id}/dismiss`, { method: 'PUT' }),
  runChecks: () => fetchApi('/alerts/run-checks', { method: 'POST' }),
};

// --- Audit API ---
export const auditApi = {
  getAll: (params?: { entity_type?: string; action?: string; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/audit${query ? `?${query}` : ''}`);
  },
  getSummary: () => fetchApi('/audit/summary'),
};

// --- Analytics API ---
export const analyticsApi = {
  getDashboard: () => fetchApi('/analytics/dashboard'),
  getInventory: () => fetchApi('/analytics/inventory'),
};

// --- AI Service Direct Client ---
export const aiApi = {
  getInventoryInsight: async () => {
    const res = await fetch(`${AI_URL}/inventory`);
    return await res.json();
  },
  getWasteInsight: async () => {
    const res = await fetch(`${AI_URL}/waste`);
    return await res.json();
  },
  getIssuanceRecommendation: async (payload: {
    blood_group: string;
    component_type: string;
    department: string;
    urgency: string;
    units_requested: number;
  }) => {
    const res = await fetch(`${AI_URL}/issuance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },
  predictReturn: async (payload: {
    blood_group: string;
    department: string;
    urgency: string;
    units_requested: number;
  }) => {
    const res = await fetch(`${AI_URL}/predict-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },
  chat: async (message: string) => {
    const res = await fetch(`${AI_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    return await res.json();
  }
};
