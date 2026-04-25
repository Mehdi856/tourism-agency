const BASE_URL = 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token') || '';
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function login(username, password) {
  const params = new URLSearchParams({ username, password });

  const res = await fetch(`${BASE_URL}/admin/authenticate?${params}`, {
    method: 'POST',
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error('Invalid credentials. Please try again.');
  }

  localStorage.setItem('access_token', data.access_token);
  return data;
}

async function addPackage(payload) {
  const res = await fetch(`${BASE_URL}/admin/trip`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return res.json();
}

async function getOverview() {
  const res = await fetch(`${BASE_URL}/admin/overview`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.res;
}

async function getReservation(transactionCode) {
  const res = await fetch(`${BASE_URL}/admin/reservation/${transactionCode}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.res;
}

async function confirmBooking(transactionCode) {
  const res = await fetch(`${BASE_URL}/admin/confirm/${transactionCode}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const b = await res.json(); detail = b.detail || detail; } catch (_) {}
    throw new Error(detail);
  }
  const json = await res.json();
  return json.res;
}

async function cancelReservation(transactionCode) {
  const res = await fetch(`${BASE_URL}/cancel_reservation/${transactionCode}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const b = await res.json(); detail = b.detail || detail; } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}
