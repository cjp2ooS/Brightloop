const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('loopflow_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('loopflow_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('loopflow_token');
  localStorage.removeItem('loopflow_user');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `API Error: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return res.json();
}
