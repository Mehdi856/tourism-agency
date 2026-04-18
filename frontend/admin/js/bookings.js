/* ================================================
   BOOKINGS PAGE — JavaScript
   ================================================ */

(function () {
  'use strict';

  const API_BASE = '/api';
  const ENDPOINTS = {
    bookings:    `${API_BASE}/bookings`,
    summary:     `${API_BASE}/bookings/summary`,
    currentUser: `${API_BASE}/auth/me`,
  };

  /* ---- State ---- */
  const state = {
    page:       1,
    pageSize:   10,
    filter:     'all',
    sort:       'date-desc',
    search:     '',
    totalItems: 0,
  };

  /* ---- Helpers ---- */
  function currency(v) {
    return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(v);
  }

  async function apiFetch(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* ---- Status/type maps ---- */
  const STATUS_BADGE = {
    confirmed:  'badge-confirmed',
    processing: 'badge-processing',
    pending:    'badge-pending',
    cancelled:  'badge-cancelled',
  };

  /* ---- Build URL with query params ---- */
  function buildUrl() {
    const params = new URLSearchParams({
      page:    state.page,
      size:    state.pageSize,
      sort:    state.sort,
    });
    if (state.filter !== 'all') params.set('status', state.filter);
    if (state.search)           params.set('q',      state.search);
    return `${ENDPOINTS.bookings}?${params}`;
  }

  /* ---- Render one table row ---- */
  function renderRow(b) {
    const statusCls = STATUS_BADGE[b.status?.toLowerCase()] || 'badge-processing';
    const hasDot    = ['confirmed','processing','pending'].includes(b.status?.toLowerCase());

    return `
      <tr data-id="${b.id}">
        <td><span class="booking-id">${b.id}</span></td>
        <td>
          <div class="booking-customer">
            <div class="avatar-initials">${(b.customer?.name || '?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
            <span style="font-size:13px;font-weight:600;color:var(--on-surface);">${b.customer?.name || '—'}</span>
          </div>
        </td>
        <td>
          <p class="booking-dest-name">${b.destination || '—'}</p>
          <p class="booking-dest-sub">${b.packageName || ''}</p>
        </td>
        <td class="booking-date">${b.date || '—'}</td>
        <td>
          <span class="badge ${statusCls}">
            ${hasDot ? '<span class="badge-dot"></span>' : ''}
            ${b.status || '—'}
          </span>
        </td>
        <td class="booking-revenue">${b.revenue != null ? currency(b.revenue) : '—'}</td>
        <td>
          <div class="booking-actions">
            <button class="action-btn primary-action" title="View" data-action="view" data-id="${b.id}">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="action-btn" title="Edit" data-action="edit" data-id="${b.id}">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="action-btn danger" title="Cancel" data-action="cancel" data-id="${b.id}">
              <span class="material-symbols-outlined">cancel</span>
            </button>
          </div>
        </td>
      </tr>`;
  }

  /* ---- Render pagination ---- */
  function renderPagination(total) {
    state.totalItems = total;
    const pages = Math.ceil(total / state.pageSize);
    const from  = (state.page - 1) * state.pageSize + 1;
    const to    = Math.min(state.page * state.pageSize, total);

    document.getElementById('pageFrom').textContent  = from;
    document.getElementById('pageTo').textContent    = to;
    document.getElementById('pageTotal').textContent = total;

    const container = document.getElementById('paginationPages');
    container.innerHTML = '';

    // Prev button
    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.disabled  = state.page === 1;
    prev.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">chevron_left</span>';
    prev.addEventListener('click', () => goToPage(state.page - 1));
    container.appendChild(prev);

    // Page numbers (max 5 shown)
    const start = Math.max(1, state.page - 2);
    const end   = Math.min(pages, start + 4);

    for (let p = start; p <= end; p++) {
      const btn = document.createElement('button');
      btn.className = `page-btn${p === state.page ? ' active' : ''}`;
      btn.textContent = p;
      btn.addEventListener('click', () => goToPage(p));
      container.appendChild(btn);
    }

    // Next button
    const next = document.createElement('button');
    next.className = 'page-btn';
    next.disabled  = state.page >= pages;
    next.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">chevron_right</span>';
    next.addEventListener('click', () => goToPage(state.page + 1));
    container.appendChild(next);
  }

  function goToPage(p) {
    state.page = p;
    loadBookings();
  }

  /* ---- Load bookings ---- */
  async function loadBookings() {
    const tbody = document.getElementById('bookingsTbody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--outline);">Loading…</td></tr>`;

    try {
      const data = await apiFetch(buildUrl());
      /*
        Expected shape:
        {
          items: [ { id, customer: {name}, destination, packageName, date, status, revenue }, ...],
          total: 128
        }
      */
      if (!data.items?.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--outline);">No bookings found.</td></tr>`;
        renderPagination(0);
        return;
      }

      tbody.innerHTML = data.items.map(renderRow).join('');
      renderPagination(data.total || data.items.length);
    } catch (err) {
      console.error('Bookings fetch failed:', err);
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--error);">Failed to load bookings.</td></tr>`;
    }
  }

  /* ---- Load summary cards ---- */
  async function loadSummary() {
    try {
      const s = await apiFetch(ENDPOINTS.summary);
      document.getElementById('activeBookingsCount').textContent = s.activeBookings ?? '—';
      document.getElementById('activeBookingsTrend').textContent = s.activeBookingsTrend ?? '—';
      document.getElementById('forecastRevenue').textContent     = s.forecastRevenue != null ? currency(s.forecastRevenue) : '—';
      document.getElementById('forecastPeriod').textContent      = s.forecastPeriod ?? '—';
      document.getElementById('pendingApprovalsCount').textContent = s.pendingApprovals ?? '—';
    } catch (_) {
      /* Non-critical */
    }
  }

  /* ---- Filter chips ---- */
  document.getElementById('filterChips').addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;

    document.querySelectorAll('#filterChips .chip').forEach(c => {
      c.className = 'chip inactive';
    });
    chip.className = 'chip active';

    state.filter = chip.dataset.filter;
    state.page   = 1;
    loadBookings();
  });

  /* ---- Sort ---- */
  document.getElementById('sortSelect').addEventListener('change', function () {
    state.sort = this.value;
    state.page = 1;
    loadBookings();
  });

  /* ---- Search (debounced 350 ms) ---- */
  let searchTimer;
  document.getElementById('bookingSearch').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = this.value.trim();
      state.page   = 1;
      loadBookings();
    }, 350);
  });

  /* ---- Table row action delegation ---- */
  document.getElementById('bookingsTbody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'view')   openViewModal(id);
    if (action === 'edit')   openEditModal(id);
    if (action === 'cancel') confirmCancel(id);
  });

  /* ---- Modal helpers ---- */
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('modalCancelBtn');

  function closeModal() { overlay.style.display = 'none'; }

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  async function openViewModal(id) {
    document.getElementById('modalTitle').textContent = `Booking #${id}`;
    document.getElementById('modalActionBtn').style.display = 'none';
    overlay.style.display = 'flex';

    const body = document.getElementById('modalBody');
    body.innerHTML = '<p style="color:var(--outline);">Loading…</p>';

    try {
      const b = await apiFetch(`${ENDPOINTS.bookings}/${id}`);
      body.innerHTML = `
        <div class="detail-grid">
          <div class="detail-field"><label>Customer</label><p>${b.customer?.name || '—'}</p></div>
          <div class="detail-field"><label>Email</label><p>${b.customer?.email || '—'}</p></div>
          <div class="detail-field"><label>Destination</label><p>${b.destination || '—'}</p></div>
          <div class="detail-field"><label>Package</label><p>${b.packageName || '—'}</p></div>
          <div class="detail-field"><label>Date</label><p>${b.date || '—'}</p></div>
          <div class="detail-field"><label>Status</label><p>${b.status || '—'}</p></div>
          <div class="detail-field"><label>Revenue</label><p>${b.revenue != null ? currency(b.revenue) : '—'}</p></div>
          <div class="detail-field"><label>Travel Class</label><p>${b.travelClass || '—'}</p></div>
        </div>
        ${b.notes ? `<div style="margin-top:8px;"><label class="form-label">Notes</label><p style="font-size:13px;color:var(--on-surface-variant);">${b.notes}</p></div>` : ''}
      `;
    } catch (_) {
      body.innerHTML = '<p style="color:var(--error);">Could not load booking details.</p>';
    }
  }

  async function openEditModal(id) {
    document.getElementById('modalTitle').textContent = `Edit Booking #${id}`;
    const actionBtn = document.getElementById('modalActionBtn');
    actionBtn.style.display = '';
    actionBtn.textContent = 'Save Changes';
    overlay.style.display = 'flex';

    const body = document.getElementById('modalBody');
    body.innerHTML = '<p style="color:var(--outline);">Loading…</p>';

    try {
      const b = await apiFetch(`${ENDPOINTS.bookings}/${id}`);
      body.innerHTML = `
        <div class="detail-grid">
          <div class="detail-field">
            <label class="form-label">Status</label>
            <select class="form-input" id="editStatus">
              <option value="confirmed"  ${b.status==='confirmed'  ? 'selected':''}>Confirmed</option>
              <option value="processing" ${b.status==='processing' ? 'selected':''}>Processing</option>
              <option value="pending"    ${b.status==='pending'    ? 'selected':''}>Pending</option>
              <option value="cancelled"  ${b.status==='cancelled'  ? 'selected':''}>Cancelled</option>
            </select>
          </div>
          <div class="detail-field">
            <label class="form-label">Travel Class</label>
            <input class="form-input" id="editClass" type="text" value="${b.travelClass || ''}" />
          </div>
          <div class="detail-field" style="grid-column:1/-1;">
            <label class="form-label">Notes</label>
            <textarea class="form-input" id="editNotes" rows="3">${b.notes || ''}</textarea>
          </div>
        </div>`;

      actionBtn.onclick = async () => {
        actionBtn.disabled = true;
        actionBtn.textContent = 'Saving…';
        try {
          await fetch(`${ENDPOINTS.bookings}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status:      document.getElementById('editStatus').value,
              travelClass: document.getElementById('editClass').value,
              notes:       document.getElementById('editNotes').value,
            }),
          });
          closeModal();
          loadBookings();
        } catch (_) {
          alert('Failed to save changes. Please try again.');
        } finally {
          actionBtn.disabled = false;
          actionBtn.textContent = 'Save Changes';
        }
      };
    } catch (_) {
      body.innerHTML = '<p style="color:var(--error);">Could not load booking for editing.</p>';
    }
  }

  async function confirmCancel(id) {
    if (!confirm(`Cancel booking #${id}? This cannot be undone.`)) return;
    try {
      await fetch(`${ENDPOINTS.bookings}/${id}/cancel`, { method: 'POST' });
      loadBookings();
    } catch (_) {
      alert('Failed to cancel booking.');
    }
  }

  /* ---- New Booking ---- */
  document.getElementById('newBookingBtn').addEventListener('click', () => {
    // Navigate to a create-booking form / open a modal — wire to your routing
    alert('New booking form — connect to your creation endpoint.');
  });

  document.getElementById('reviewTasksBtn').addEventListener('click', () => {
    state.filter = 'pending';
    state.page   = 1;
    document.querySelectorAll('#filterChips .chip').forEach(c => c.className = 'chip inactive');
    const pendingChip = document.querySelector('[data-filter="pending"]');
    if (pendingChip) pendingChip.className = 'chip active';
    loadBookings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---- Current user ---- */
  async function loadCurrentUser() {
    try {
      const u = await apiFetch(ENDPOINTS.currentUser);
      document.getElementById('sidebarName').textContent = u.name  || 'Administrator';
      document.getElementById('sidebarRole').textContent = u.role  || 'Admin';
    } catch (_) {}
  }

  /* ---- Check URL param for direct booking open ---- */
  function checkUrlParams() {
    const params = new URLSearchParams(location.search);
    if (params.has('id'))   setTimeout(() => openViewModal(params.get('id')), 500);
    if (params.has('edit')) setTimeout(() => openEditModal(params.get('edit')), 500);
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    loadBookings();
    loadSummary();
    checkUrlParams();
  });

})();
