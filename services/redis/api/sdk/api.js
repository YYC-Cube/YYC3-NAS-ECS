const BASE_URL = process.env.API_BASE_URL || 'https://api.0379.email';

const request = async (path, method = 'GET', body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return res.json();
};

export const login = (data) => request('/user/login', 'POST', data);
export const register = (data) => request('/user/register', 'POST', data);
export const getUserInfo = (token) => request('/user/info', 'GET', null, token);
export const updateUser = (data, token) => request('/user/update', 'PUT', data, token);
export const logout = (token) => request('/user/logout', 'POST', null, token);
