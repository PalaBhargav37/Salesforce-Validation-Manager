const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:5000';

const apiCall = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

export const api = {
  getMe: () => apiCall('/api/me'),
  logout: () => apiCall('/auth/logout', { method: 'POST' }),
  getValidationRules: () => apiCall('/api/validation-rules'),
  toggleRule: (id, active) => apiCall(`/api/validation-rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active })
  }),
  bulkToggle: (rules) => apiCall('/api/validation-rules', {
    method: 'PATCH',
    body: JSON.stringify({ rules })
  }),
  deploy: (rules) => apiCall('/api/deploy', {
    method: 'POST',
    body: JSON.stringify({ rules })
  }),
  loginUrl: () => `${BASE_URL}/auth/login`
};
