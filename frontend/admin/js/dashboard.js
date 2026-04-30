/* ================================================
   DASHBOARD — JavaScript
   Linked to: GET /admin/overview via api.js → getOverview()
   ================================================ */

(function () {
  'use strict';

  let liveViewInterval = null;
  let isLiveView = false;
  let lastOverviewData = null;

  function currency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  /* ============================================================
     CURRENT USER
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
     BOOKING TRENDS CHART — Canvas bar chart from top_routes
  ============================================================ */
  function loadBookingTrends(routes) {
    const container = document.getElementById('barChart');
    if (!container) return;

    if (!routes?.length) {
      container.innerHTML = '<p style="color:var(--outline);font-size:13px;text-align:center;width:100%;padding-top:40px;">No booking data available yet.</p>';
      return;
    }

    container.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width  = container.clientWidth  || 600;
    canvas.height = container.clientHeight || 220;
    container.appendChild(canvas);

    const ctx    = canvas.getContext('2d');
    const W      = canvas.width;
    const H      = canvas.height;
    const pad    = { top: 24, right: 20, bottom: 50, left: 45 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;
    const maxVal = Math.max(...routes.map(r => r.bookings), 1);
    const barW   = Math.min(60, (chartW / routes.length) * 0.55);
    const gap    = chartW / routes.length;

    ctx.strokeStyle = 'rgba(26,115,232,0.1)';
    ctx.lineWidth   = 1;
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = pad.top + chartH - (chartH * i / steps);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(100,116,139,0.8)';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * i / steps), pad.left - 6, y + 4);
    }

    routes.forEach((r, i) => {
      const barH = (r.bookings / maxVal) * chartH;
      const x    = pad.left + gap * i + (gap - barW) / 2;
      const y    = pad.top  + chartH - barH;

      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, '#1a73e8');
      grad.addColorStop(1, 'rgba(26,115,232,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#1a73e8';
      ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.bookings, x + barW / 2, y - 6);

      ctx.fillStyle = 'rgba(100,116,139,0.9)';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      const label = r.country.length > 10 ? r.country.slice(0, 9) + '…' : r.country;
      ctx.fillText(label, x + barW / 2, pad.top + chartH + 18);
    });
  }

  const trendPeriodEl = document.getElementById('trendPeriod');
  if (trendPeriodEl) trendPeriodEl.addEventListener('change', () => {
    if (lastOverviewData) loadBookingTrends(lastOverviewData.top_routes);
  });

  /* ============================================================
     TOP ROUTES
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
  if (viewAllBtn) viewAllBtn.addEventListener('click', () => {
    window.location.href = 'destinationPackagaes.html';
  });

  /* ============================================================
     RECENT BOOKINGS
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
        <td><span class="badge badge-regular">${b.transaction_code || '—'}</span></td>
        <td>
          <span class="badge ${statusClass}">
            <span class="badge-dot"></span>${statusLabel}
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

  window.viewBooking = function (transactionCode) {
    window.location.href = `bookingMang.html?id=${transactionCode}`;
  };

  /* ============================================================
     LIVE VIEW — auto-refresh every 10 seconds
  ============================================================ */
  function showLiveIndicator(active) {
    const btn = document.getElementById('liveViewBtn');
    if (!btn) return;
    if (active) {
      btn.innerHTML = `<span class="material-symbols-outlined">stop_circle</span> Stop Live`;
      btn.style.background = '#d32f2f';
    } else {
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:10px;color:#4caf50;">circle</span> Live View`;
      btn.style.background = '';
    }
  }

  function showLastUpdated() {
    const now = new Date().toLocaleTimeString();
    let el = document.getElementById('liveUpdatedAt');
    if (!el) {
      el = document.createElement('p');
      el.id = 'liveUpdatedAt';
      el.style.cssText = 'font-size:11px;color:#4caf50;margin:4px 0 0;text-align:right;';
      const tbody = document.getElementById('recentBookingsTbody');
      if (tbody) tbody.closest('table')?.parentElement?.appendChild(el);
    }
    el.textContent = `🟢 Live — last updated at ${now}`;
  }

  async function refreshDashboard() {
    try {
      const data = await getOverview();
      lastOverviewData = data;
      renderMetrics(data);
      renderTopRoutes(data.top_routes);
      renderRecentBookings(data.recent_bookings);
      loadBookingTrends(data.top_routes);
      showLastUpdated();
    } catch (err) {
      console.error('Live refresh failed:', err);
    }
  }

  function toggleLiveView() {
    if (isLiveView) {
      clearInterval(liveViewInterval);
      liveViewInterval = null;
      isLiveView = false;
      showLiveIndicator(false);
      const el = document.getElementById('liveUpdatedAt');
      if (el) el.remove();
    } else {
      isLiveView = true;
      showLiveIndicator(true);
      refreshDashboard();
      liveViewInterval = setInterval(refreshDashboard, 10000);
    }
  }

  const liveViewBtn = document.getElementById('liveViewBtn');
  if (liveViewBtn) liveViewBtn.addEventListener('click', toggleLiveView);

  /* ============================================================
     DOWNLOAD REPORT — PDF via jsPDF + autoTable
  ============================================================ */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload  = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function downloadPDF(data) {
    if (!data) {
      alert('No data loaded yet. Please wait for the dashboard to load.');
      return;
    }

    const btn = document.getElementById('downloadReportBtn');
    if (btn) { btn.textContent = 'Generating…'; btn.disabled = true; }

    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const now = new Date().toLocaleString();
      const blue = [26, 115, 232];
      const dark = [30, 41, 59];

      // ── Header banner ──
      doc.setFillColor(...blue);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Tourism Agency — Overview Report', 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${now}`, 14, 22);

      // ── Summary KPI boxes ──
      const kpis = [
        { label: 'Total Revenue',    value: currency(data.total_revenue) },
        { label: 'Total Bookings',   value: data.total_bookings },
        { label: 'Pending Approval', value: data.pending_count },
        { label: 'Active Trips',     value: data.active_trips },
      ];

      const boxW = 43, boxH = 20, boxY = 34, gap = 4;
      kpis.forEach((k, i) => {
        const x = 14 + i * (boxW + gap);
        doc.setFillColor(240, 247, 255);
        doc.roundedRect(x, boxY, boxW, boxH, 3, 3, 'F');
        doc.setTextColor(...blue);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(String(k.value), x + boxW / 2, boxY + 11, { align: 'center' });
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(k.label, x + boxW / 2, boxY + 17, { align: 'center' });
      });

      // ── Top Routes table ──
      doc.setTextColor(...dark);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Routes', 14, 66);

      doc.autoTable({
        startY: 69,
        head: [['Country', 'Bookings']],
        body: (data.top_routes || []).map(r => [r.country, r.bookings]),
        headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: dark },
        alternateRowStyles: { fillColor: [245, 248, 255] },
        margin: { left: 14, right: 14 },
        tableWidth: 80,
      });

      // ── Recent Bookings table ──
      const afterRoutes = doc.lastAutoTable.finalY + 8;
      doc.setTextColor(...dark);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Bookings', 14, afterRoutes);

      doc.autoTable({
        startY: afterRoutes + 3,
        head: [['Code', 'Customer', 'Email', 'Trip', 'Country', 'Status', 'Revenue']],
        body: (data.recent_bookings || []).map(b => [
          b.transaction_code || '—',
          b.customer_name    || '—',
          b.customer_email   || '—',
          b.trip_name        || '—',
          b.country          || '—',
          b.confirmed ? 'Confirmed' : 'Pending',
          b.revenue != null ? currency(b.revenue) : '—',
        ]),
        headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: dark },
        alternateRowStyles: { fillColor: [245, 248, 255] },
        columnStyles: {
          0: { cellWidth: 24 },
          5: { cellWidth: 20 },
          6: { cellWidth: 22 },
        },
        margin: { left: 14, right: 14 },
        didDrawCell: (hookData) => {
          if (hookData.section === 'body' && hookData.column.index === 5) {
            const val = hookData.cell.raw;
            const color = val === 'Confirmed' ? [46, 125, 50] : [245, 124, 0];
            hookData.cell.styles.textColor = color;
          }
        },
      });

      // ── Footer ──
      const pageH = doc.internal.pageSize.height;
      doc.setFillColor(...blue);
      doc.rect(0, pageH - 10, 210, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Tourism Agency — Confidential', 14, pageH - 4);
      doc.text(`Page 1`, 196, pageH - 4, { align: 'right' });

      doc.save(`overview_report_${Date.now()}.pdf`);

    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please check your connection and try again.');
    } finally {
      if (btn) { btn.textContent = 'Download Report'; btn.disabled = false; }
    }
  }

  const downloadBtn = document.getElementById('downloadReportBtn');
  if (downloadBtn) downloadBtn.addEventListener('click', () => downloadPDF(lastOverviewData));

  /* ============================================================
     INIT
  ============================================================ */
  async function init() {
    loadCurrentUser();
    try {
      const data = await getOverview();
      lastOverviewData = data;
      renderMetrics(data);
      renderTopRoutes(data.top_routes);
      renderRecentBookings(data.recent_bookings);
      loadBookingTrends(data.top_routes);
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
