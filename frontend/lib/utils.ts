import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get access token from localStorage
export function getAccessToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

// Make an authenticated API request
export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
}

// Refresh the JWT access token
export async function refreshToken() {
  const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh') : null;
  if (!refresh) return null;
  const res = await fetch('http://127.0.0.1:8000/api/token/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  const data = await res.json();
  if (data.access) {
    localStorage.setItem('token', data.access);
    return data.access;
  }
  return null;
}
