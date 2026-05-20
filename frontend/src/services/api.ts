const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(path: string, method: string, body?: any) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, options);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Error en la solicitud: ${response.statusText}`);
  }

  return data;
}

export const apiGet = (path: string) => request(path, 'GET');
export const apiPost = (path: string, body: any) => request(path, 'POST', body);
export const apiPut = (path: string, body: any) => request(path, 'PUT', body);
export const apiDelete = (path: string) => request(path, 'DELETE');
