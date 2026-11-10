const BACKEND_URL = 'http://127.0.0.1:5000';
import { getAuthToken } from './auth';

// Add this helper function:
function getHeaders() {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
export async function generateItinerary({ 
  destination, 
  days, 
  budget, 
  travelWith, 
  interests, 
  homeCurrency = 'INR (₹)' 
}) {
  const response = await fetch(`${BACKEND_URL}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination,
      days,
      budget,
      travelWith,
      interests,
      homeCurrency,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate plan.');
  }

  return data.itinerary;
}

export async function saveTripToDatabase(itinerary) {
  const response = await fetch(`${BACKEND_URL}/api/trips`, {
    method: 'POST',
    headers: getHeaders(), // 👈 Uses auth headers!
    body: JSON.stringify({ itinerary }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to save trip.');
  return data.savedTrip || data.trip;
}

export async function fetchSavedTrips() {
  const response = await fetch(`${BACKEND_URL}/api/trips`, {
    headers: getHeaders(), // 👈 Uses auth headers!
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch saved trips.');
  return data.trips;
}

export async function deleteTripFromDatabase(id) {
  const response = await fetch(`${BACKEND_URL}/api/trips/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete trip.');
  return data;
}