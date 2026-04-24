const BASE_URL = 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token') || '';
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
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
