/* ============================================================
   MakeMYtrip — Centralized API Service Layer
   js/api.js

   Single source of truth for all backend communication.
   Backend team: update API_BASE_URL to match your server.
   ============================================================ */

var API_BASE_URL = "http://localhost:8000";

/* ── Helper: build query string from an object ───────────── */
function _buildQuery(params) {
  var parts = [];
  for (var key in params) {
    if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null && params[key] !== "") {
      parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
    }
  }
  return parts.length ? "?" + parts.join("&") : "";
}

/* ── Helper: handle fetch response ───────────────────────── */
async function _handleResponse(response) {
  if (!response.ok) {
    var errorBody;
    try { errorBody = await response.json(); } catch (e) { errorBody = null; }
    var message = (errorBody && errorBody.detail) ? errorBody.detail : "Request failed (HTTP " + response.status + ")";
    throw new Error(message);
  }
  return response.json();
}

/* ─────────────────────────────────────────────────────────────
   1. GET VISUAL TRIPS  (homepage featured trips)
      GET /visual
      Returns: array of trip objects with nested hotel
   ───────────────────────────────────────────────────────────── */
async function fetchVisualTrips() {
  var response = await fetch(API_BASE_URL + "/visual");
  return _handleResponse(response);
}

/* ─────────────────────────────────────────────────────────────
   2. SEARCH TRIPS
      GET /search_trips?startdate=...&enddate=...&location=...&numadults=...&numchild=...
      Returns: array of trip objects with nested hotel
   ───────────────────────────────────────────────────────────── */
async function searchTripsAPI(params) {
  var query = _buildQuery({
    startdate: params.startdate,
    enddate:   params.enddate,
    location:  params.location,
    numadults: params.numadults,
    numchild:  params.numchild
  });
  var response = await fetch(API_BASE_URL + "/search_trips" + query);
  return _handleResponse(response);
}

/* ─────────────────────────────────────────────────────────────
   3. REGISTER & RESERVE  (new customer + reservation)
      POST /register
      Body: { fullname, phonnum, email, birthdate, trip_id }
      Returns: { message, transaction_code, customer_id, trip_id }
   ───────────────────────────────────────────────────────────── */
async function registerAndReserve(data) {
  var response = await fetch(API_BASE_URL + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return _handleResponse(response);
}

/* ─────────────────────────────────────────────────────────────
   4. RESERVE ONLY  (existing customer by email)
      POST /reserve
      Body: { email, trip_id }
      Returns: { message, transaction_code, customer_id }
   ───────────────────────────────────────────────────────────── */
async function reserveTrip(data) {
  var response = await fetch(API_BASE_URL + "/reserve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return _handleResponse(response);
}

/* ─────────────────────────────────────────────────────────────
   5. GET RESERVATION  (by transaction code)
      GET /reservation/{transaction_code}
      Returns: reservation object with nested customer & trip
   ───────────────────────────────────────────────────────────── */
async function getReservation(transactionCode) {
  var response = await fetch(API_BASE_URL + "/reservation/" + encodeURIComponent(transactionCode));
  return _handleResponse(response);
}

/* ─────────────────────────────────────────────────────────────
   6. CANCEL RESERVATION  (by transaction code)
      DELETE /reservation/{transaction_code}
      Returns: { message }
   ───────────────────────────────────────────────────────────── */
async function cancelReservation(transactionCode) {
  var response = await fetch(API_BASE_URL + "/reservation/" + encodeURIComponent(transactionCode), {
    method: "DELETE"
  });
  return _handleResponse(response);
}

/* ─────────────────────────────────────────────────────────────
   7. GET TRIP BY ID  (client-side: fetch all visual and filter)
      Until backend provides a GET /trip/{id} endpoint, we
      fetch all visual trips and filter by id.
   ───────────────────────────────────────────────────────────── */
async function fetchTripById(tripId) {
  var trips = await fetchVisualTrips();
  var id = parseInt(tripId, 10);
  var trip = null;
  for (var i = 0; i < trips.length; i++) {
    if (trips[i].id === id) { trip = trips[i]; break; }
  }
  if (!trip) throw new Error("Trip not found (ID: " + tripId + ")");
  return trip;
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Read URL search params
   ───────────────────────────────────────────────────────────── */
function getUrlParams() {
  var params = {};
  var search = window.location.search.substring(1);
  if (!search) return params;
  var pairs = search.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var kv = pairs[i].split("=");
    if (kv.length === 2) {
      params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
    }
  }
  return params;
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Format date range from Supabase DATERANGE
   Input:  "[2025-06-01,2025-06-10)" (Postgres daterange)
   Output: { start: "2025-06-01", end: "2025-06-10" }
   ───────────────────────────────────────────────────────────── */
function parseDateRange(daterange) {
  if (!daterange) return { start: "", end: "" };
  var cleaned = daterange.replace(/[\[\]\(\)]/g, "");
  var parts = cleaned.split(",");
  return {
    start: (parts[0] || "").trim(),
    end:   (parts[1] || "").trim()
  };
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Format price from Supabase MONEY type
   Input:  "$1,200.00" or "1200.00" or 1200
   Output: 1200  (number)
   ───────────────────────────────────────────────────────────── */
function parsePrice(price) {
  if (typeof price === "number") return price;
  if (typeof price === "string") {
    return parseFloat(price.replace(/[^0-9.\-]/g, "")) || 0;
  }
  return 0;
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Format number as EUR currency display
   Input:  4850
   Output: "€4,850"
   ───────────────────────────────────────────────────────────── */
function formatEUR(amount) {
  return "€" + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Calculate days between two date strings
   ───────────────────────────────────────────────────────────── */
function daysBetween(startStr, endStr) {
  var start = new Date(startStr);
  var end = new Date(endStr);
  var diff = Math.abs(end - start);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Format a date string nicely
   Input:  "2025-06-01"
   Output: "Jun 1, 2025"
   ───────────────────────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "";
  var d = new Date(dateStr + "T00:00:00");
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Format short date for pill display
   Input:  "2025-06-01"
   Output: "Jun 1"
   ───────────────────────────────────────────────────────────── */
function formatDateShort(dateStr) {
  if (!dateStr) return "";
  var d = new Date(dateStr + "T00:00:00");
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[d.getMonth()] + " " + d.getDate();
}

/* ─────────────────────────────────────────────────────────────
   TOAST NOTIFICATION SYSTEM
   ───────────────────────────────────────────────────────────── */
function _ensureToastContainer() {
  var c = document.getElementById("toast-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}

/**
 * Show a toast notification.
 * @param {string} message  - The text to display
 * @param {string} type     - "error" | "success" | "info" | "warning"
 * @param {number} duration - ms before auto-close (default 4000)
 */
function showToast(message, type, duration) {
  type = type || "info";
  duration = duration || 4000;
  var container = _ensureToastContainer();

  var icons = { error: "✕", success: "✓", info: "ℹ", warning: "⚠" };
  var toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || "ℹ") + '</span>'
    + '<span>' + message + '</span>'
    + '<button class="toast-close" onclick="this.parentElement.classList.add(\'toast-exit\');setTimeout(function(){toast.remove()},300)">×</button>';

  container.appendChild(toast);

  /* Auto-close */
  var closeTimer = setTimeout(function() {
    toast.classList.add("toast-exit");
    setTimeout(function(){ if (toast.parentElement) toast.remove(); }, 300);
  }, duration);

  /* Manual close */
  toast.querySelector(".toast-close").onclick = function() {
    clearTimeout(closeTimer);
    toast.classList.add("toast-exit");
    setTimeout(function(){ if (toast.parentElement) toast.remove(); }, 300);
  };
}

/* ─────────────────────────────────────────────────────────────
   LOCALSTORAGE — TRIP CACHE
   Cache selected trip data so we don't re-fetch on every page
   ───────────────────────────────────────────────────────────── */
function saveTripCache(trip) {
  try { localStorage.setItem("mmt_trip_cache", JSON.stringify(trip)); } catch(e) {}
}

function loadTripCache() {
  try {
    var data = localStorage.getItem("mmt_trip_cache");
    return data ? JSON.parse(data) : null;
  } catch(e) { return null; }
}

function clearTripCache() {
  try { localStorage.removeItem("mmt_trip_cache"); } catch(e) {}
}

/* ─────────────────────────────────────────────────────────────
   LOCALSTORAGE — TRAVELLER DATA
   Persist traveller counts across pages
   ───────────────────────────────────────────────────────────── */
function saveTravellerData(data) {
  try { localStorage.setItem("mmt_travellers", JSON.stringify(data)); } catch(e) {}
}

function loadTravellerData() {
  try {
    var data = localStorage.getItem("mmt_travellers");
    return data ? JSON.parse(data) : { adults: 1, children: 0, rooms: 1 };
  } catch(e) { return { adults: 1, children: 0, rooms: 1 }; }
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Generate loading spinner HTML
   ───────────────────────────────────────────────────────────── */
function loadingHTML(text) {
  return '<div class="loading-spinner"><div class="spinner"></div><span>' + (text || "Loading...") + '</span></div>';
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Generate skeleton card HTML
   ───────────────────────────────────────────────────────────── */
function skeletonCardHTML(count) {
  var html = '';
  for (var i = 0; i < (count || 3); i++) {
    html += '<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-text medium"></div><div class="skeleton-text short"></div></div>';
  }
  return html;
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Calculate max rooms for a given number of adults
   Rule: Max 2 adults per room
   ───────────────────────────────────────────────────────────── */
function maxRoomsForAdults(numAdults) {
  return Math.max(1, numAdults);
}

function minRoomsForAdults(numAdults) {
  return Math.max(1, Math.ceil(numAdults / 2));
}

