/* ================================================
   DASHBOARD — JavaScript
   Linked to: GET /admin/overview via api.js → getOverview()
   ================================================ */

(function () {
  'use strict';

  function currency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  /* ============================================================
     CURRENT USER  (read from localStorage — set at login)
  ============================================================ */
  function loadCurrentUser() {
    const username = localStorage.getItem('username') || 'Administrator';
    const nameEl = document.getElementById('adminName');
    const roleEl = document.getElementById('adminRole');
    if (nameEl) nameEl.textContent = username;
    if (roleEl) roleEl.textContent = 'Admin';
  }

  /* ============================================================
     KPI METRICS
     Backend fields: total_revenue, total_bookings, pending_count, active_trips, top_routes
  ============================================================ */
  function renderMetrics(data) {
    const revenueEl = document.getElementById('totalRevenue');
    if (revenueEl) revenueEl.textContent = currency(data.total_revenue);

    const revenueBarEl = document.getElementById('revenueBar');
    if (revenueBarEl) revenueBarEl.style.width = '100%';

    const revenueChangeEl = document.getElementById('revenueChange');
    if (revenueChangeEl) revenueChangeEl.textContent = '';

    const revenueTargetEl = document.getElementById('revenueTarget');
    if (revenueTargetEl) revenueTargetEl.textContent = '';

    const bookingsEl = document.getElementById('totalBookings');
    if (bookingsEl) bookingsEl.textContent = data.total_bookings.toLocaleString();

    const bookingsChangeEl = document.getElementById('bookingsChange');
    if (bookingsChangeEl) bookingsChangeEl.textContent = '';

    const pendingEl = document.getElementById('pendingCount');
    if (pendingEl) pendingEl.textContent = `${data.pending_count} pending approval`;

    const activeEl = document.getElementById('activeTrips');
    if (activeEl) activeEl.textContent = data.active_trips.toLocaleString();

    const topHubsEl = document.getElementById('topHubs');
    if (topHubsEl && data.top_routes?.length) {
      topHubsEl.textContent = `Top hubs: ${data.top_routes.map(r => r.country).join(', ')}`;
    }
  }

  /* ============================================================
     BOOKING TRENDS CHART  (no backend endpoint — placeholder)
  ============================================================ */
  function loadBookingTrends() {
    const container = document.getElementById('barChart');
    if (container) {
      container.innerHTML = '<p style="color:var(--outline);font-size:13px;text-align:center;width:100%;">Chart data unavailable</p>';
    }
  }

  const trendPeriodEl = document.getElementById('trendPeriod');
  if (trendPeriodEl) trendPeriodEl.addEventListener('change', loadBookingTrends);

  /* ============================================================
     TOP ROUTES
     Backend fields: [{ country, bookings }]
  ============================================================ */
  function renderTopRoutes(routes) {
    const list = document.getElementById('routesList');
    if (!list) return;

    if (!routes?.length) {
      list.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:13px;">No route data yet.</p>';
      return;
    }

    const maxBookings = Math.max(...routes.map(r => r.bookings));

    list.innerHTML = routes.slice(0, 4).map(r => {
      const pct = maxBookings > 0 ? Math.round((r.bookings / maxBookings) * 100) : 0;
      return `
        <div class="route-item">
          <div class="route-info">
            <div class="route-info-top">
              <span>${r.country}</span>
              <span class="route-pct">${r.bookings} bookings</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  const viewAllBtn = document.getElementById('viewAllRoutesBtn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      window.location.href = 'destinationPackagaes.html';
    });
  }

  /* ============================================================
     RECENT BOOKINGS
     Backend fields: transaction_code, customer_name, customer_email,
                     trip_name, country, confirmed, revenue
  ============================================================ */
  function buildBookingRow(b) {
    const statusClass = b.confirmed ? 'badge-confirmed' : 'badge-pending';
    const statusLabel = b.confirmed ? 'Confirmed' : 'Pending';
    const initials    = (b.customer_name || '?')[0].toUpperCase();

    return `
      <tr>
        <td>
          <div class="customer-cell">
            <div class="avatar-initials">${initials}</div>
            <div>
              <p class="customer-name">${b.customer_name || '—'}</p>
              <p class="customer-email">${b.customer_email || ''}</p>
            </div>
          </div>
        </td>
        <td>
          <p class="dest-name">${b.trip_name || '—'}</p>
          <p class="dest-sub">${b.country || ''}</p>
        </td>
        <td>
          <span class="badge badge-regular">${b.transaction_code || '—'}</span>
        </td>
        <td>
          <span class="badge ${statusClass}">
            <span class="badge-dot"></span>
            ${statusLabel}
          </span>
        </td>
        <td class="revenue-value">${b.revenue != null ? currency(b.revenue) : '—'}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn primary-action" title="View"
              onclick="viewBooking('${b.transaction_code}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
          </div>
        </td>
      </tr>`;
  }

  function renderRecentBookings(bookings) {
    const tbody = document.getElementById('recentBookingsTbody');
    if (!tbody) return;

    if (!bookings?.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--outline);">No bookings yet.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(buildBookingRow).join('');
  }

  /* ============================================================
     BOOKING ACTIONS
  ============================================================ */
  window.viewBooking = function (transactionCode) {
    window.location.href = `bookingMang.html?id=${transactionCode}`;
  };

  /* ============================================================
     HEADER BUTTONS
  ============================================================ */
  const downloadBtn = document.getElementById('downloadReportBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      alert('Report download — not yet connected to backend.');
    });
  }

  const liveViewBtn = document.getElementById('liveViewBtn');
  if (liveViewBtn) {
    liveViewBtn.addEventListener('click', () => {
      alert('Live view — not yet connected to backend.');
    });
  }

  /* ============================================================
     INIT
  ============================================================ */
  async function init() {
    loadCurrentUser();
    loadBookingTrends();

    try {
      const data = await getOverview(); // → api.js: GET /admin/overview
      renderMetrics(data);
      renderTopRoutes(data.top_routes);
      renderRecentBookings(data.recent_bookings);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      ['totalRevenue', 'totalBookings', 'activeTrips'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'N/A';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
