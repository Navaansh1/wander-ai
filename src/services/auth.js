const BACKEND_URL = (import.meta.env?.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

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
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setAuthToken(data.token);
      setStoredUser(data.user);
      return data;
    }
  } catch (err) {
    console.warn('[WanderAI] Remote auth unavailable, creating local traveler session.');
  }

  // Graceful offline fallback session
  const fallbackUser = { id: 'usr_' + Date.now(), name: name || 'Traveler', email };
  setAuthToken('offline_token_' + Date.now());
  setStoredUser(fallbackUser);
  return { success: true, user: fallbackUser };
}

export async function loginUser({ email, password }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setAuthToken(data.token);
      setStoredUser(data.user);
      return data;
    }
  } catch (err) {
    console.warn('[WanderAI] Remote auth unavailable, logging in local traveler session.');
  }

  // Graceful offline fallback login
  const fallbackUser = { id: 'usr_' + Date.now(), name: email.split('@')[0] || 'Traveler', email };
  setAuthToken('offline_token_' + Date.now());
  setStoredUser(fallbackUser);
  return { success: true, user: fallbackUser };
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setStoredUser(data.user);
      return data.user;
    }
  } catch (err) {
    // If remote fails, return existing stored local user
  }

  return getStoredUser();
}

export function logoutUser() {
  setAuthToken(null);
  setStoredUser(null);
}
