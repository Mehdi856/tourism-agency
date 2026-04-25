/* ================================================
   BOOKINGS PAGE — JavaScript
   Linked to booking.py via api.js:
   - getOverview()          → GET /admin/overview      (list + summary)
   - getReservation(code)   → GET /admin/reservation/:code
   - confirmBooking(code)   → PATCH /admin/confirm/:code
   - cancelReservation(code)→ DELETE /cancel_reservation/:code
   ================================================ */

(function () {
  'use strict';

  /* ---- State ---- */
  const state = {
    page:       1,
    pageSize:   10,
    filter:     'all',
    search:     '',
    allBookings: [],
  };

  /* ---- Helpers ---- */
  function currency(v) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  }

  const STATUS_BADGE = {
    true:  'badge-confirmed',
    false: 'badge-pending',
  };

  /* ---- Render one table row ---- */
  function renderRow(b) {
    const statusCls   = b.confirmed ? 'badge-confirmed' : 'badge-pending';
    const statusLabel = b.confirmed ? 'Confirmed' : 'Pending';
    const initials    = (b.customer_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return `
      <tr data-id="${b.transaction_code}">
        <td><span class="booking-id">${b.transaction_code}</span></td>
        <td>
          <div class="booking-customer">
            <div class="avatar-initials">${initials}</div>
            <span style="font-size:13px;font-weight:600;color:var(--on-surface);">${b.customer_name || '—'}</span>
          </div>
        </td>
        <td>
          <p class="booking-dest-name">${b.trip_name || '—'}</p>
          <p class="booking-dest-sub">${b.country || ''}</p>
        </td>
        <td class="booking-date">—</td>
        <td>
          <span class="badge ${statusCls}">
            <span class="badge-dot"></span>
            ${statusLabel}
          </span>
        </td>
        <td class="booking-revenue">${b.revenue != null ? currency(b.revenue) : '—'}</td>
        <td>
          <div class="booking-actions">
            <button class="action-btn primary-action" title="View" data-action="view" data-id="${b.transaction_code}">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            ${!b.confirmed ? `
            <button class="action-btn" title="Confirm" data-action="confirm" data-id="${b.transaction_code}">
              <span class="material-symbols-outlined">check_circle</span>
            </button>` : ''}
            <button class="action-btn danger" title="Cancel" data-action="cancel" data-id="${b.transaction_code}">
              <span class="material-symbols-outlined">cancel</span>
            </button>
          </div>
        </td>
      </tr>`;
  }

  /* ---- Render pagination ---- */
  function renderPagination(total) {
    const pages = Math.ceil(total / state.pageSize);
    const from  = (state.page - 1) * state.pageSize + 1;
    const to    = Math.min(state.page * state.pageSize, total);

    document.getElementById('pageFrom').textContent  = from;
    document.getElementById('pageTo').textContent    = to;
    document.getElementById('pageTotal').textContent = total;

    const container = document.getElementById('paginationPages');
    container.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.disabled  = state.page === 1;
    prev.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">chevron_left</span>';
    prev.addEventListener('click', () => goToPage(state.page - 1));
    container.appendChild(prev);

    const start = Math.max(1, state.page - 2);
    const end   = Math.min(pages, start + 4);
    for (let p = start; p <= end; p++) {
      const btn = document.createElement('button');
      btn.className = `page-btn${p === state.page ? ' active' : ''}`;
      btn.textContent = p;
      btn.addEventListener('click', () => goToPage(p));
      container.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'page-btn';
    next.disabled  = state.page >= pages;
    next.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">chevron_right</span>';
    next.addEventListener('click', () => goToPage(state.page + 1));
    container.appendChild(next);
  }

  function goToPage(p) {
    state.page = p;
    renderTable();
  }

  /* ---- Filter + search + paginate in memory ---- */
  function renderTable() {
    const tbody = document.getElementById('bookingsTbody');

    let filtered = state.allBookings;

    // Filter by status
    if (state.filter === 'confirmed') filtered = filtered.filter(b => b.confirmed);
    if (state.filter === 'pending')   filtered = filtered.filter(b => !b.confirmed);

    // Search by name, email, trip or transaction code
    if (state.search) {
      const q = state.search.toLowerCase();
      filtered = filtered.filter(b =>
        (b.customer_name  || '').toLowerCase().includes(q) ||
        (b.customer_email || '').toLowerCase().includes(q) ||
        (b.trip_name      || '').toLowerCase().includes(q) ||
        (b.transaction_code || '').toLowerCase().includes(q)
      );
    }

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--outline);">No bookings found.</td></tr>`;
      renderPagination(0);
      return;
    }

    const start = (state.page - 1) * state.pageSize;
    const page  = filtered.slice(start, start + state.pageSize);

    tbody.innerHTML = page.map(renderRow).join('');
    renderPagination(filtered.length);
  }

  /* ---- Load all bookings + summary from overview ---- */
  async function loadBookings() {
    const tbody = document.getElementById('bookingsTbody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--outline);">Loading…</td></tr>`;

    try {
      const data = await getOverview(); // → api.js: GET /admin/overview

      // Summary cards
      const activeEl = document.getElementById('activeBookingsCount');
      if (activeEl) activeEl.textContent = data.total_bookings ?? '—';

      const pendingEl = document.getElementById('pendingApprovalsCount');
      if (pendingEl) pendingEl.textContent = data.pending_count ?? '—';

      const forecastEl = document.getElementById('forecastRevenue');
      if (forecastEl) forecastEl.textContent = data.total_revenue != null ? currency(data.total_revenue) : '—';

      // Store all recent bookings in state
      state.allBookings = data.recent_bookings || [];
      renderTable();

    } catch (err) {
      console.error('Bookings fetch failed:', err);
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--error);">Failed to load bookings.</td></tr>`;
    }
  }

  /* ---- Filter chips ---- */
  document.getElementById('filterChips').addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    document.querySelectorAll('#filterChips .chip').forEach(c => c.className = 'chip inactive');
    chip.className = 'chip active';
    state.filter = chip.dataset.filter;
    state.page   = 1;
    renderTable();
  });

  /* ---- Sort ---- */
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.addEventListener('change', () => { state.page = 1; renderTable(); });

  /* ---- Search ---- */
  let searchTimer;
  document.getElementById('bookingSearch').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = this.value.trim();
      state.page   = 1;
      renderTable();
    }, 350);
  });

  /* ---- Table row action delegation ---- */
  document.getElementById('bookingsTbody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'view')    openViewModal(id);
    if (action === 'confirm') doConfirm(id);
    if (action === 'cancel')  doCancel(id);
  });

  /* ---- Modal helpers ---- */
  const overlay  = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('modalCancelBtn');

  function closeModal() { overlay.style.display = 'none'; }
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  /* ---- View modal ---- */
  async function openViewModal(transactionCode) {
    document.getElementById('modalTitle').textContent = `Booking ${transactionCode}`;
    const actionBtn = document.getElementById('modalActionBtn');
    actionBtn.style.display = 'none';
    overlay.style.display = 'flex';

    const body = document.getElementById('modalBody');
    body.innerHTML = '<p style="color:var(--outline);">Loading…</p>';

    try {
      const b = await getReservation(transactionCode); // → api.js: GET /admin/reservation/:code
      const customer = b.customer || {};
      const trip     = b.trip     || {};

      body.innerHTML = `
        <div class="detail-grid">
          <div class="detail-field"><label>Transaction Code</label><p>${b.transaction_code || '—'}</p></div>
          <div class="detail-field"><label>Status</label><p>${b.confirmation ? 'Confirmed' : 'Pending'}</p></div>
          <div class="detail-field"><label>Customer</label><p>${customer.fullname || '—'}</p></div>
          <div class="detail-field"><label>Email</label><p>${customer.email || '—'}</p></div>
          <div class="detail-field"><label>Phone</label><p>${customer.phonnum || '—'}</p></div>
          <div class="detail-field"><label>Trip</label><p>${trip.name || '—'}</p></div>
          <div class="detail-field"><label>Country</label><p>${trip.country || '—'}</p></div>
          <div class="detail-field"><label>Price</label><p>${trip.price != null ? currency(parseFloat(String(trip.price).replace(/[$,]/g,''))) : '—'}</p></div>
        </div>`;

      // Show confirm button if not yet confirmed
      if (!b.confirmation) {
        actionBtn.style.display = '';
        actionBtn.textContent = 'Confirm Booking';
        actionBtn.onclick = async () => {
          actionBtn.disabled = true;
          actionBtn.textContent = 'Confirming…';
          try {
            await confirmBooking(transactionCode); // → api.js: PATCH /admin/confirm/:code
            closeModal();
            loadBookings();
          } catch (err) {
            alert(`Error: ${err.message}`);
          } finally {
            actionBtn.disabled = false;
            actionBtn.textContent = 'Confirm Booking';
          }
        };
      }
    } catch (_) {
      body.innerHTML = '<p style="color:var(--error);">Could not load booking details.</p>';
    }
  }

  /* ---- Confirm action ---- */
  async function doConfirm(transactionCode) {
    if (!confirm(`Confirm booking ${transactionCode}?`)) return;
    try {
      await confirmBooking(transactionCode); // → api.js: PATCH /admin/confirm/:code
      loadBookings();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  /* ---- Cancel action ---- */
  async function doCancel(transactionCode) {
    if (!confirm(`Cancel booking ${transactionCode}? This cannot be undone.`)) return;
    try {
      await cancelReservation(transactionCode); // → api.js: DELETE /cancel_reservation/:code
      loadBookings();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  /* ---- Current user ---- */
  function loadCurrentUser() {
    const username = localStorage.getItem('username') || 'Administrator';
    const nameEl = document.getElementById('sidebarName');
    const roleEl = document.getElementById('sidebarRole');
    if (nameEl) nameEl.textContent = username;
    if (roleEl) roleEl.textContent = 'Admin';
  }

  /* ---- New Booking button ---- */
  const newBookingBtn = document.getElementById('newBookingBtn');
  if (newBookingBtn) {
    newBookingBtn.addEventListener('click', () => {
      alert('New booking form — not yet connected to backend.');
    });
  }

  /* ---- Review tasks button ---- */
  const reviewBtn = document.getElementById('reviewTasksBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      state.filter = 'pending';
      state.page   = 1;
      document.querySelectorAll('#filterChips .chip').forEach(c => c.className = 'chip inactive');
      const pendingChip = document.querySelector('[data-filter="pending"]');
      if (pendingChip) pendingChip.className = 'chip active';
      renderTable();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Check URL param for direct booking open ---- */
  function checkUrlParams() {
    const params = new URLSearchParams(location.search);
    if (params.has('id')) setTimeout(() => openViewModal(params.get('id')), 500);
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    loadBookings();
    checkUrlParams();
  });

})();
