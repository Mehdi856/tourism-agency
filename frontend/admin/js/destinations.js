/* ================================================
   DESTINATIONS PAGE — JavaScript
   ================================================ */

(function () {
  'use strict';

  const API_BASE = '/api';
  const ENDPOINTS = {
    packages:    `${API_BASE}/packages`,
    insights:    `${API_BASE}/packages/insights`,
    currentUser: `${API_BASE}/auth/me`,
  };

  let allPackages   = [];
  let activeCategory = 'all';
  let searchTerm    = '';

  /* ---- Fetch ---- */
  async function apiFetch(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* ---- Category badge colour map ---- */
  const CATEGORY_COLOURS = {
    beach:     { bg: 'var(--tertiary)',          color: 'var(--on-tertiary)' },
    city:      { bg: 'var(--primary-container)', color: 'var(--on-primary-container)' },
    mountain:  { bg: 'var(--tertiary)',          color: 'var(--on-tertiary)' },
    adventure: { bg: 'var(--secondary)',         color: 'var(--on-secondary)' },
    cultural:  { bg: 'var(--primary)',           color: 'var(--on-primary)' },
  };

  function categoryStyle(cat) {
    const c = CATEGORY_COLOURS[cat?.toLowerCase()] || { bg: 'var(--secondary)', color: 'var(--on-secondary)' };
    return `background:${c.bg};color:${c.color};`;
  }

  /* ---- Render featured (first) card ---- */
  function renderFeaturedCard(p) {
    const customerAvatars = (p.recentCustomerAvatars || []).slice(0, 3).map(url =>
      `<img src="${url}" alt="customer" onerror="this.style.display='none';" />`
    ).join('');
    const extraCount = (p.totalCustomers || 0) - 3;

    return `
      <article class="package-card featured">
        <div class="featured-inner">
          <div class="featured-image-wrap">
            <img src="${p.imageUrl || ''}" alt="${p.name}"
                 onerror="this.style.background='var(--surface-container-high)';this.removeAttribute('src');" />
            <span class="featured-category-badge">${p.category || 'Featured'}</span>
          </div>
          <div class="featured-body">
            <div>
              <h3>${p.name}</h3>
              <p class="package-location">
                <span class="material-symbols-outlined">location_on</span>
                ${p.location || '—'}
              </p>
              ${p.tags?.length ? `<div class="package-tags">${p.tags.map(t => `<span class="package-tag">${t}</span>`).join('')}</div>` : ''}
            </div>

            ${customerAvatars ? `
              <div class="customers-row">
                <div class="customer-avatars">
                  ${customerAvatars}
                  ${extraCount > 0 ? `<div class="avatar-more">+${extraCount}</div>` : ''}
                </div>
                <span class="customers-count">${p.totalCustomers} customers booked</span>
              </div>` : ''}

            <div>
              <div class="package-price-row">
                <div class="package-price-block">
                  <p>Price</p>
                  <p class="package-price">$${(p.price || 0).toLocaleString()}</p>
                </div>
                <div class="package-duration-block">
                  <p>Duration</p>
                  <p class="package-duration">${p.durationDays || '—'} Days</p>
                </div>
              </div>
              <div class="featured-actions">
                <button class="action-btn" title="Edit" onclick="editPackage('${p.id}')">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="action-btn primary-action" title="Preview" onclick="previewPackage('${p.id}')">
                  <span class="material-symbols-outlined">visibility</span>
                </button>
                <button class="btn-primary" style="padding:10px 18px;font-size:13px;" onclick="manageBookings('${p.id}')">
                  Manage Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>`;
  }

  /* ---- Render small card ---- */
  function renderSmallCard(p) {
    return `
      <article class="package-card small">
        <div class="small-image-wrap">
          <img src="${p.imageUrl || ''}" alt="${p.name}"
               onerror="this.style.background='var(--surface-container-high)';this.removeAttribute('src');" />
          <span class="small-category-badge" style="${categoryStyle(p.category)}">${p.category || '—'}</span>
        </div>
        <div class="small-body">
          <h4>${p.name}</h4>
          <p class="package-location">
            <span class="material-symbols-outlined">location_on</span>
            ${p.location || '—'}
          </p>
          <div class="package-price-row" style="margin-top:18px;">
            <div class="package-price-block">
              <p>Price</p>
              <p class="package-price" style="font-size:22px;">$${(p.price || 0).toLocaleString()}</p>
            </div>
            <div class="package-duration-block">
              <p>Duration</p>
              <p class="package-duration" style="font-size:16px;">${p.durationDays || '—'} Days</p>
            </div>
          </div>
        </div>
      </article>`;
  }

  /* ---- Render insights card ---- */
  function renderInsightCard(ins) {
    return `
      <article class="package-card insight-card">
        <div>
          <h4>Agency Insight</h4>
          <p>Your destination inventory is growing. Reach more customers with tiered pricing.</p>
        </div>
        <div class="insight-stats">
          <div class="insight-capacity">
            <div class="insight-capacity-header">
              <span>Package Capacity</span>
              <span>${ins.capacityPct ?? '—'}%</span>
            </div>
            <div class="insight-capacity-bar">
              <div class="insight-capacity-fill" style="width:${ins.capacityPct ?? 0}%"></div>
            </div>
          </div>
          <div class="insight-mini-grid">
            <div class="insight-mini-card">
              <p>Active Tours</p>
              <p>${ins.activeTours ?? '—'}</p>
            </div>
            <div class="insight-mini-card">
              <p>Pending Approval</p>
              <p>${ins.pendingApproval ?? '—'}</p>
            </div>
          </div>
        </div>
      </article>`;
  }

  /* ---- Filter and render ---- */
  function renderPackages() {
    const grid = document.getElementById('packagesGrid');
    const loading = document.getElementById('loadingState');

    let filtered = allPackages;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category?.toLowerCase() === activeCategory);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    loading.style.display = 'none';
    grid.style.display    = 'grid';

    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column:span 12;text-align:center;padding:60px;color:var(--outline);">No packages found.</div>`;
      return;
    }

    /*
      Layout order:
       - 1st package: featured (span 8)
       - insights card: span 4 (next to featured)
       - Remaining: small cards (span 4)
    */
    let html = renderFeaturedCard(filtered[0]);

    // We'll fetch insights separately; render a placeholder that JS fills in
    html += `<div id="insightCardSlot" style="grid-column:span 4;"></div>`;

    filtered.slice(1).forEach(p => {
      html += renderSmallCard(p);
    });

    grid.innerHTML = html;

    // Fill insight slot
    loadInsights();
  }

  /* ---- Load insights ---- */
  async function loadInsights() {
    const slot = document.getElementById('insightCardSlot');
    if (!slot) return;
    try {
      const ins = await apiFetch(ENDPOINTS.insights);
      slot.outerHTML = renderInsightCard(ins);
    } catch (_) {
      slot.outerHTML = renderInsightCard({});
    }
  }

  /* ---- Load packages ---- */
  async function loadPackages() {
    try {
      /*
        Expected shape: [
          {
            id, name, location, category, imageUrl,
            price, durationDays,
            tags: [],
            totalCustomers, recentCustomerAvatars: []
          }, ...
        ]
      */
      allPackages = await apiFetch(ENDPOINTS.packages);
      renderPackages();
    } catch (err) {
      console.error('Failed to load packages:', err);
      document.getElementById('loadingState').innerHTML =
        '<p style="color:var(--error);">Failed to load packages.</p>';
    }
  }

  /* ---- Category filter chips ---- */
  document.getElementById('categoryChips').addEventListener('click', e => {
    const chip = e.target.closest('[data-category]');
    if (!chip) return;

    document.querySelectorAll('#categoryChips .chip').forEach(c => c.className = 'chip inactive');
    chip.className = 'chip active';

    activeCategory = chip.dataset.category;
    renderPackages();
  });

  /* ---- Search (debounced) ---- */
  let searchTimer;
  document.getElementById('destSearch').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTerm = this.value.trim();
      renderPackages();
    }, 300);
  });

  /* ---- Add package ---- */
  document.getElementById('addPackageBtn').addEventListener('click', () => {
    // Navigate to a create-package form — wire to your routing
    alert('Add Package — connect to your creation form.');
  });

  /* ---- Row actions ---- */
  window.editPackage = function (id) {
    alert(`Edit package ${id} — connect to your edit form.`);
  };

  window.previewPackage = function (id) {
    alert(`Preview package ${id} — connect to your preview page.`);
  };

  window.manageBookings = function (id) {
    window.location.href = `bookingMang.html?package=${id}`;
  };

  /* ---- Current user ---- */
  async function loadCurrentUser() {
    try {
      const u = await apiFetch(ENDPOINTS.currentUser);
      if (document.getElementById('sidebarName')) document.getElementById('sidebarName').textContent = u.name || 'Administrator';
      if (document.getElementById('sidebarRole')) document.getElementById('sidebarRole').textContent = u.role || 'Admin';
    } catch (_) {}
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    loadPackages();
  });

})();
