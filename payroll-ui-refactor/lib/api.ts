const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';

export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = `Request failed with ${response.status}`;
    try {
      const jsonError = JSON.parse(text);
      if (jsonError.message) {
        if (Array.isArray(jsonError.message)) {
          errorMessage = jsonError.message.join(', ');
        } else {
          errorMessage = jsonError.message;
        }
      } else if (jsonError.error) {
        errorMessage = jsonError.error;
      }
    } catch {
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

export async function apiFetchAuth<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return apiFetch<T>(path, { ...init, headers });
}
