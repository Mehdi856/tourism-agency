/* ================================================
   SHARED UTILITIES — Tourism Admin Panel
   ================================================ */

/**
 * Initialises common UI behaviours present on every page:
 *  - Active nav-link highlighting
 *  - Notification button click feedback
 *  - Search bar keyboard shortcut hint
 *  - Toggle switches (if present)
 */
(function () {
  'use strict';

  /* ---- Active nav-link ---- */
  function highlightActiveNav() {
    const currentFile = location.pathname.split('/').pop() || 'adminDash.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      link.classList.toggle('active', href === currentFile);
    });
  }

  /* ---- Toggle switches ---- */
  function initToggles() {
    document.querySelectorAll('.toggle input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const label = cb.closest('.toggle');
        if (!label) return;
        const thumb = label.querySelector('.toggle-thumb');
        if (thumb) thumb.style.transform = cb.checked ? 'translateX(22px)' : 'translateX(0)';
      });
    });
  }

  /* ---- Notification icon click ---- */
  function initNotifications() {
    document.querySelectorAll('.icon-btn[data-notifications]').forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove dot when opened (backend will re-add on reload)
        const dot = btn.querySelector('.badge');
        if (dot) dot.style.display = 'none';
      });
    });
  }

  /* ---- Search shortcut (/ key) ---- */
  function initSearchShortcut() {
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('.topbar-search input');
        if (searchInput) searchInput.focus();
      }
    });
  }

  /* ---- Initialise ---- */
  document.addEventListener('DOMContentLoaded', () => {
    highlightActiveNav();
    initToggles();
    initNotifications();
    initSearchShortcut();
  });
})();
