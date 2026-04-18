/* ================================================
   DASHBOARD — JavaScript
   ================================================ */

(function () {
  'use strict';

  /* ============================================================
     API CONFIG
     Replace base URL and endpoint paths to match your backend.
     All endpoints should return JSON.
  ============================================================ */
  const API_BASE = '/api';

  const ENDPOINTS = {
    metrics:        `${API_BASE}/dashboard/metrics`,
    bookingTrends:  `${API_BASE}/dashboard/booking-trends`,
    topRoutes:      `${API_BASE}/dashboard/top-routes`,
    recentBookings: `${API_BASE}/bookings/recent?limit=5`,
    currentUser:    `${API_BASE}/auth/me`,
  };

  /* ============================================================
     HELPERS
  ============================================================ */
  function currency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  function pct(num) {
    return `${num >= 0 ? '+' : ''}${num}%`;
  }

  async function apiFetch(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* ============================================================
     CURRENT USER
  ============================================================ */
  async function loadCurrentUser() {
    try {
      const user = await apiFetch(ENDPOINTS.currentUser);
      document.getElementById('adminName').textContent = user.name || 'Administrator';
      document.getElementById('adminRole').textContent = user.role || 'Admin';
      const avatar = document.getElementById('adminAvatar');
      if (user.avatarUrl) avatar.src = user.avatarUrl;
    } catch (_) {
      /* silently fail — defaults already set in HTML */
    }
  }

  /* ============================================================
     KPI METRICS
  ============================================================ */
  async function loadMetrics() {
    try {
      const m = await apiFetch(ENDPOINTS.metrics);

      document.getElementById('totalRevenue').textContent  = currency(m.totalRevenue);
      document.getElementById('revenueChange').textContent = pct(m.revenueChangePct);
      document.getElementById('revenueTarget').textContent = `Target: ${currency(m.revenueTarget)}`;
      document.getElementById('revenueBar').style.width    = `${Math.min(100, (m.totalRevenue / m.revenueTarget) * 100).toFixed(1)}%`;

      document.getElementById('totalBookings').textContent = m.totalBookings.toLocaleString();
      document.getElementById('bookingsChange').textContent = pct(m.bookingsChangePct);
      document.getElementById('pendingCount').textContent  = `${m.pendingApproval} pending approval`;

      document.getElementById('activeTrips').textContent   = m.activeTrips.toLocaleString();
      document.getElementById('topHubs').textContent       = `Top hubs: ${m.topHubs.join(', ')}`;
    } catch (err) {
      console.error('Failed to load metrics:', err);
      ['totalRevenue','totalBookings','activeTrips'].forEach(id => {
        document.getElementById(id).textContent = 'N/A';
      });
    }
  }

  /* ============================================================
     BOOKING TRENDS CHART
  ============================================================ */
  async function loadBookingTrends(period = 6) {
    const container = document.getElementById('barChart');

    try {
      const data = await apiFetch(`${ENDPOINTS.bookingTrends}?months=${period}`);
      /*
        Expected shape: [{ month: "Jan", value: 120 }, ...]
        Max value used to calculate relative bar heights.
      */
      const max = Math.max(...data.map(d => d.value));
      const peakMonth = data.reduce((a, b) => a.value > b.value ? a : b);

      container.innerHTML = data.map(item => {
        const heightPct = max > 0 ? ((item.value / max) * 85 + 10).toFixed(1) : 10;
        const isPeak    = item.month === peakMonth.month;
        return `
          <div class="bar-col${isPeak ? ' peak' : ''}">
            <div
              class="bar-fill-col${isPeak ? ' peak' : ''}"
              style="height:${heightPct}%"
              data-value="${item.value} bookings"
            >${isPeak ? '<span class="bar-peak-label">Peak</span>' : ''}</div>
            <span class="bar-month">${item.month}</span>
          </div>`;
      }).join('');
    } catch (_) {
      container.innerHTML = '<p style="color:var(--outline);font-size:13px;text-align:center;width:100%;">Chart data unavailable</p>';
    }
  }

  document.getElementById('trendPeriod').addEventListener('change', function () {
    loadBookingTrends(parseInt(this.value));
  });

  /* ============================================================
     TOP ROUTES
  ============================================================ */
  async function loadTopRoutes() {
    const list = document.getElementById('routesList');

    try {
      const routes = await apiFetch(ENDPOINTS.topRoutes);
      /*
        Expected shape: [{ name: "Denpasar, Bali", pct: 88, thumbUrl: "..." }, ...]
      */
      list.innerHTML = routes.slice(0, 4).map(r => `
        <div class="route-item">
          <img class="route-thumb" src="${r.thumbUrl || ''}" alt="${r.name}"
               onerror="this.style.background='rgba(255,255,255,0.1)';this.style.display='block';" />
          <div class="route-info">
            <div class="route-info-top">
              <span>${r.name}</span>
              <span class="route-pct">${r.pct}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${r.pct}%"></div>
            </div>
          </div>
        </div>
      `).join('');
    } catch (_) {
      list.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:13px;">Route data unavailable</p>';
    }
  }

  document.getElementById('viewAllRoutesBtn').addEventListener('click', () => {
    window.location.href = 'destinationPackagaes.html';
  });

  /* ============================================================
     RECENT BOOKINGS
  ============================================================ */
  const STATUS_BADGE = {
    confirmed:  'badge-confirmed',
    processing: 'badge-processing',
    pending:    'badge-pending',
    cancelled:  'badge-cancelled',
  };

  const TYPE_BADGE = {
    vip:      'badge-vip',
    regular:  'badge-regular',
    new:      'badge-new',
  };

  function buildBookingRow(b) {
    const statusClass = STATUS_BADGE[b.status?.toLowerCase()] || 'badge-processing';
    const typeClass   = TYPE_BADGE[b.customerType?.toLowerCase()] || 'badge-regular';
    const hasDot      = ['confirmed','processing','pending'].includes(b.status?.toLowerCase());

    return `
      <tr>
        <td>
          <div class="customer-cell">
            <img src="${b.customer.avatarUrl || ''}" alt="${b.customer.name}"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
            <div class="avatar-initials" style="display:none;">${(b.customer.name || '?')[0]}</div>
            <div>
              <p class="customer-name">${b.customer.name || '—'}</p>
              <p class="customer-email">${b.customer.email || ''}</p>
            </div>
          </div>
        </td>
        <td>
          <p class="dest-name">${b.destination || '—'}</p>
          <p class="dest-sub">${b.travelClass || ''} · ${b.date || ''}</p>
        </td>
        <td>
          <span class="badge ${typeClass}">${b.customerType || '—'}</span>
        </td>
        <td>
          <span class="badge ${statusClass}">
            ${hasDot ? '<span class="badge-dot"></span>' : ''}
            ${b.status || '—'}
          </span>
        </td>
        <td class="revenue-value">${b.revenue != null ? currency(b.revenue) : '—'}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn primary-action" title="View" onclick="viewBooking('${b.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="action-btn" title="Edit" onclick="editBooking('${b.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
          </div>
        </td>
      </tr>`;
  }

  async function loadRecentBookings() {
    const tbody = document.getElementById('recentBookingsTbody');

    try {
      const bookings = await apiFetch(ENDPOINTS.recentBookings);

      if (!bookings.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--outline);">No bookings yet.</td></tr>';
        return;
      }

      tbody.innerHTML = bookings.map(buildBookingRow).join('');
    } catch (err) {
      console.error('Failed to load bookings:', err);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--outline);">Could not load bookings.</td></tr>';
    }
  }

  /* ============================================================
     BOOKING ACTIONS (placeholders — connect to your router)
  ============================================================ */
  window.viewBooking = function (id) {
    window.location.href = `bookingMang.html?id=${id}`;
  };

  window.editBooking = function (id) {
    window.location.href = `bookingMang.html?edit=${id}`;
  };

  /* ============================================================
     HEADER BUTTONS
  ============================================================ */
  document.getElementById('downloadReportBtn').addEventListener('click', async () => {
    // Trigger a report download from backend
    window.location.href = `${API_BASE}/reports/dashboard/download`;
  });

  document.getElementById('liveViewBtn').addEventListener('click', () => {
    // Replace with your live-view route / modal
    alert('Live view feature — connect to your real-time endpoint.');
  });

  /* ============================================================
     INIT
  ============================================================ */
  async function init() {
    await Promise.allSettled([
      loadCurrentUser(),
      loadMetrics(),
      loadBookingTrends(6),
      loadTopRoutes(),
      loadRecentBookings(),
    ]);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
