const BACKEND_URL = 'http://127.0.0.1:5000';

export function getAuthToken() {
  return localStorage.getItem('wanderai_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('wanderai_token', token);
  } else {
    localStorage.removeItem('wanderai_token');
  }
}

export function getStoredUser() {
  const user = localStorage.getItem('wanderai_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('wanderai_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('wanderai_user');
  }
}

export async function registerUser({ name, email, password }) {
  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed.');

  setAuthToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed.');

  setAuthToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      setAuthToken(null);
      setStoredUser(null);
      return null;
    }
    const data = await res.json();
    setStoredUser(data.user);
    return data.user;
  } catch (err) {
    return null;
  }
}

export function logoutUser() {
  setAuthToken(null);
  setStoredUser(null);
}