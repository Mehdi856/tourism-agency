/* ================================================
   DESTINATIONS PAGE — JavaScript
   Adapted to existing backend endpoints
   ================================================ */

(function () {
  'use strict';

  const BASE_URL = 'http://localhost:8000';
  const token = localStorage.getItem('access_token') || '';

  /* ---- Auth header for admin endpoints ---- */
  function authHeaders() {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /* ---- Fetch helpers ---- */
  async function apiFetch(url, useAuth = false) {
    const res = await fetch(url, {
      headers: useAuth ? authHeaders() : {},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  let allPackages    = [];
  let activeCategory = 'all';
  let searchTerm     = '';

  /* ---- Parse price from "$4,850.00" → 4850 ---- */
  function parsePrice(raw) {
    return parseFloat(String(raw || '0').replace('$', '').replace(/,/g, '').trim()) || 0;
  }

  /* ---- Parse duration days from "[2025-06-01,2025-06-10]" ---- */
  function parseDuration(dateRange) {
    try {
      const clean = String(dateRange).replace(/[\[\]\(\)]/g, '').trim();
      const [start, end] = clean.split(',').map(d => new Date(d.trim()));
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : '—';
    } catch (_) {
      return '—';
    }
  }

  /* ---- Map backend trip → frontend package shape ---- */
  function mapTripToPackage(trip) {
    return {
      id:                    trip.id,
      name:                  trip.name,
      location:              trip.country || '—',
      category:              trip.country || '—',
      imageUrl:              (trip.media && trip.media[0]) || (trip.hotel && trip.hotel.img) || '',
      price:                 parsePrice(trip.price),
      durationDays:          parseDuration(trip.date),
      daysLeft:              trip.expired
        ? new Date(trip.expired).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      tags:                  [
                               trip.hotel ? trip.hotel.name : null,
                               trip.adults ? `${trip.adults} Adults` : null,
                               trip.children ? `${trip.children} Children` : null,
                               trip.room ? `${trip.room} Room(s)` : null,
                             ].filter(Boolean),
      totalCustomers:        0,
      recentCustomerAvatars: [],
    };
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

  /* ================================================
     ADD PACKAGE MODAL — linked to POST /admin/trip
     ================================================ */
  function buildModal() {
    const existing = document.getElementById('addPackageModal');
    if (existing) { existing.style.display = 'flex'; return; }

    const modal = document.createElement('div');
    modal.id = 'addPackageModal';
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;
      display:flex;align-items:center;justify-content:center;padding:20px;
    `;

    modal.innerHTML = `
      <div style="background:var(--surface);border-radius:24px;padding:36px;width:100%;max-width:720px;
                  max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-md);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
          <h2 style="font-size:22px;font-weight:800;color:var(--primary);">Add New Package</h2>
          <button id="closeModalBtn" style="background:none;border:none;cursor:pointer;font-size:24px;color:var(--outline);">✕</button>
        </div>

        <!-- Trip Info -->
        <p style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--outline);margin-bottom:12px;">Trip Info</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Trip Name</label>
            <input id="f_name" type="text" placeholder="e.g. Sahara Adventure" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Country</label>
            <input id="f_country" type="text" placeholder="e.g. Algeria" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div style="grid-column:span 2;">
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Description</label>
            <textarea id="f_descripiton" rows="3" placeholder="Describe the trip…" style="width:100%;margin-top:4px;resize:vertical;" class="form-input"></textarea>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Price per person ($)</label>
            <input id="f_price" type="number" placeholder="4850" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Available Places</label>
            <input id="f_places" type="number" placeholder="20" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Start Date</label>
            <input id="f_start_date" type="date" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">End Date</label>
            <input id="f_end_date" type="date" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Adults</label>
            <input id="f_adults" type="number" placeholder="2" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Children</label>
            <input id="f_children" type="number" placeholder="1" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Rooms</label>
            <input id="f_room" type="number" placeholder="1" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Media URLs (comma separated)</label>
            <input id="f_media" type="text" placeholder="https://img1.jpg, https://img2.jpg" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding-top:20px;">
            <input id="f_visual" type="checkbox" checked style="width:18px;height:18px;cursor:pointer;"/>
            <label for="f_visual" style="font-size:13px;font-weight:600;color:var(--on-surface-variant);cursor:pointer;">Show on homepage (visual)</label>
          </div>
        </div>

        <!-- Hotel Info -->
        <p style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--outline);margin-bottom:12px;margin-top:8px;">Hotel</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Hotel Name</label>
            <input id="f_hotel_name" type="text" placeholder="e.g. Oasis Hotel" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Rating (1-5)</label>
            <input id="f_hotel_rating" type="number" min="1" max="5" placeholder="4" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div style="grid-column:span 2;">
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Hotel Image URL</label>
            <input id="f_hotel_img" type="text" placeholder="https://hotel.jpg" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
        </div>

        <!-- Outbound Flight -->
        <p style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--outline);margin-bottom:12px;margin-top:8px;">✈ Outbound Flight</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Company</label>
            <input id="f_out_company" type="text" placeholder="e.g. Air Algerie" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Flight Code</label>
            <input id="f_out_code" type="text" placeholder="e.g. AH 204" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Class</label>
            <input id="f_out_class" type="text" placeholder="Economy" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Duration</label>
            <input id="f_out_duration" type="text" placeholder="2h 15m" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Departure Location</label>
            <input id="f_out_dep_loc" type="text" placeholder="ALG · Algiers" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Departure Time</label>
            <input id="f_out_dep_time" type="time" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Arrival Location</label>
            <input id="f_out_arr_loc" type="text" placeholder="NAP · Naples" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Arrival Time</label>
            <input id="f_out_arr_time" type="time" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
        </div>

        <!-- Return Flight -->
        <p style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--outline);margin-bottom:12px;margin-top:8px;">✈ Return Flight</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Company</label>
            <input id="f_ret_company" type="text" placeholder="e.g. Air Algerie" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Flight Code</label>
            <input id="f_ret_code" type="text" placeholder="e.g. AH 205" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Class</label>
            <input id="f_ret_class" type="text" placeholder="Economy" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Duration</label>
            <input id="f_ret_duration" type="text" placeholder="2h 55m" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Departure Location</label>
            <input id="f_ret_dep_loc" type="text" placeholder="NAP · Naples" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Departure Time</label>
            <input id="f_ret_dep_time" type="time" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Arrival Location</label>
            <input id="f_ret_arr_loc" type="text" placeholder="ALG · Algiers" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--on-surface-variant);">Arrival Time</label>
            <input id="f_ret_arr_time" type="time" style="width:100%;margin-top:4px;" class="form-input"/>
          </div>
        </div>

        <!-- Error & Submit -->
        <p id="modalError" style="color:var(--error);font-size:13px;font-weight:600;display:none;margin-bottom:12px;"></p>
        <div style="display:flex;gap:12px;justify-content:flex-end;">
          <button id="cancelModalBtn" class="btn-secondary">Cancel</button>
          <button id="submitPackageBtn" class="btn-primary">
            <span class="material-symbols-outlined">add</span>
            Create Package
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.getElementById('submitPackageBtn').addEventListener('click', submitPackage);
  }

  function closeModal() {
    const modal = document.getElementById('addPackageModal');
    if (modal) modal.style.display = 'none';
  }

  /* ---- Submit → POST /admin/trip ---- */
  async function submitPackage() {
    const errorEl = document.getElementById('modalError');
    errorEl.style.display = 'none';

    const g = id => document.getElementById(id)?.value?.trim();

    const payload = {
      name:        g('f_name'),
      description: g('f_descripiton'),
      price:       parseFloat(g('f_price')) || 0,
      places:      parseInt(g('f_places')) || 0,
      start_date:  g('f_start_date'),
      end_date:    g('f_end_date'),
      visual:      document.getElementById('f_visual').checked,
      media:       g('f_media').split(',').map(s => s.trim()).filter(Boolean),
      adults:      parseInt(g('f_adults')) || 0,
      children:    parseInt(g('f_children')) || 0,
      room:        parseInt(g('f_room')) || 0,
      country:     g('f_country'),
      hotel: {
        name:   g('f_hotel_name'),
        rating: parseInt(g('f_hotel_rating')) || 1,
        img:    g('f_hotel_img'),
      },
      outbound_flight: {
        company:            g('f_out_company'),
        flight_code:        g('f_out_code'),
        class_:             g('f_out_class') || 'Economy',
        departure_location: g('f_out_dep_loc'),
        departure_time:     g('f_out_dep_time'),
        arrival_location:   g('f_out_arr_loc'),
        arrival_time:       g('f_out_arr_time'),
        duration:           g('f_out_duration'),
        is_direct:          true,
      },
      return_flight: {
        company:            g('f_ret_company'),
        flight_code:        g('f_ret_code'),
        class_:             g('f_ret_class') || 'Economy',
        departure_location: g('f_ret_dep_loc'),
        departure_time:     g('f_ret_dep_time'),
        arrival_location:   g('f_ret_arr_loc'),
        arrival_time:       g('f_ret_arr_time'),
        duration:           g('f_ret_duration'),
        is_direct:          true,
      },
    };

    // Basic validation
    if (!payload.name || !payload.country || !payload.start_date || !payload.end_date) {
      errorEl.textContent = 'Please fill in all required fields (name, country, dates).';
      errorEl.style.display = 'block';
      return;
    }

    const btn = document.getElementById('submitPackageBtn');
    btn.textContent = 'Creating…';
    btn.disabled = true;

    try {
      const res = await fetch(`${BASE_URL}/admin/trip`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      closeModal();
      await loadPackages(); // refresh the grid
    } catch (err) {
      errorEl.textContent = `Error: ${err.message}`;
      errorEl.style.display = 'block';
    } finally {
      btn.innerHTML = '<span class="material-symbols-outlined">add</span> Create Package';
      btn.disabled = false;
    }
  }

  /* ================================================
     RENDER FUNCTIONS
     ================================================ */

  function renderFeaturedCard(p) {
    const tagsHtml = p.tags?.length
      ? `<div class="package-tags">${p.tags.map(t => `<span class="package-tag">${t}</span>`).join('')}</div>`
      : '';

    return `
      <article class="package-card featured">
        <div class="featured-inner">
          <div class="featured-image-wrap">
            <img src="${p.imageUrl}" alt="${p.name}"
                 onerror="this.style.background='var(--surface-container-high)';this.removeAttribute('src');" />
            <span class="featured-category-badge">${p.location}</span>
          </div>
          <div class="featured-body">
            <div>
              <h3>${p.name}</h3>
              <p class="package-location">
                <span class="material-symbols-outlined">location_on</span>
                ${p.location}
              </p>
              ${tagsHtml}
            </div>
            <div>
              <div class="package-price-row">
                <div class="package-price-block">
                  <p>Price</p>
                  <p class="package-price">$${p.price.toLocaleString()}</p>
                </div>
                <div class="package-duration-block">
                  <p>Trip Duration</p>
                  <p class="package-duration">${p.durationDays} Days</p>
                </div>
                <div class="package-duration-block">
                  <p>Offer Expires</p>
                  <p class="package-duration" style="font-size:18px;">${p.daysLeft}</p>
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

  function renderSmallCard(p) {
    return `
      <article class="package-card small">
        <div class="small-image-wrap">
          <img src="${p.imageUrl}" alt="${p.name}"
               onerror="this.style.background='var(--surface-container-high)';this.removeAttribute('src');" />
          <span class="small-category-badge" style="${categoryStyle(p.category)}">${p.location}</span>
        </div>
        <div class="small-body">
          <h4>${p.name}</h4>
          <p class="package-location">
            <span class="material-symbols-outlined">location_on</span>
            ${p.location}
          </p>
          <div class="package-price-row" style="margin-top:18px;">
            <div class="package-price-block">
              <p>Price</p>
              <p class="package-price" style="font-size:22px;">$${p.price.toLocaleString()}</p>
            </div>
            <div class="package-duration-block">
              <p>Trip Duration</p>
              <p class="package-duration" style="font-size:16px;">${p.durationDays} Days</p>
            </div>
            <div class="package-duration-block">
              <p>Offer Expires</p>
              <p class="package-duration" style="font-size:14px;">${p.daysLeft}</p>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderInsightCard(ins) {
    const capacityPct = ins.capacityPct ?? 0;
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
              <span>${capacityPct}%</span>
            </div>
            <div class="insight-capacity-bar">
              <div class="insight-capacity-fill" style="width:${capacityPct}%"></div>
            </div>
          </div>
          <div class="insight-mini-grid">
            <div class="insight-mini-card">
              <p>Active Tours</p>
              <p>${ins.active_trips ?? '—'}</p>
            </div>
            <div class="insight-mini-card">
              <p>Pending Approval</p>
              <p>${ins.pending_count ?? '—'}</p>
            </div>
          </div>
        </div>
      </article>`;
  }

  /* ---- Filter and render ---- */
  function renderPackages() {
    const grid    = document.getElementById('packagesGrid');
    const loading = document.getElementById('loadingState');

    let filtered = allPackages;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.location?.toLowerCase() === activeCategory);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }

    loading.style.display = 'none';
    grid.style.display    = 'grid';

    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column:span 12;text-align:center;padding:60px;color:var(--outline);">No packages found.</div>`;
      return;
    }

    let html = renderFeaturedCard(filtered[0]);
    html += `<div id="insightCardSlot" style="grid-column:span 4;"></div>`;
    filtered.slice(1).forEach(p => { html += renderSmallCard(p); });

    grid.innerHTML = html;
    loadInsights();
  }

  async function loadInsights() {
    const slot = document.getElementById('insightCardSlot');
    if (!slot) return;
    try {
      const data = await apiFetch(`${BASE_URL}/admin/overview`, true);
      const overview = data.res || data;
      const totalPackages = allPackages.length || 1;
      overview.capacityPct = Math.round((overview.active_trips / totalPackages) * 100);
      slot.outerHTML = renderInsightCard(overview);
    } catch (_) {
      slot.outerHTML = renderInsightCard({});
    }
  }

  async function loadPackages() {
    try {
      const trips = await apiFetch(`${BASE_URL}/visual`);
      allPackages = trips.map(mapTripToPackage);
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

  /* ---- Add package button → open modal ---- */
  document.getElementById('addPackageBtn').addEventListener('click', () => {
    buildModal();
  });

  /* ---- Row actions ---- */
  window.editPackage = function (id) {
    alert(`Edit package ${id} — connect to your edit form.`);
  };

  window.previewPackage = function (id) {
    window.location.href = `tripDetails.html?id=${id}`;
  };

  window.manageBookings = function (id) {
    window.location.href = `bookingMang.html?package=${id}`;
  };

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', () => {
    loadPackages();
  });

})();
