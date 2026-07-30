'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function rawFetch(url: string, options: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  let { res, data } = await rawFetch(url, options);

  // Access token cookie is short-lived (15 min). If it's expired, try a silent
  // refresh using the longer-lived refresh token, then retry the request once.
  if (
    res.status === 401 &&
    url !== '/api/auth/refresh' &&
    url !== '/api/auth/login'
  ) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null);

    if (refreshRes && refreshRes.ok) {
      ({ res, data } = await rawFetch(url, options));
    }
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}
