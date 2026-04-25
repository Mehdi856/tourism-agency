/* ============================================================
   MakeMYtrip — Trip Details JavaScript
   js/details.js
   Depends on: api.js (loaded before this script)
   ============================================================ */

/* ── Helpers ───────────────────────────────────────────────── */

/** Set textContent of an element by id, safely */
function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Parse a numeric price from strings like "$2,500.00", "€4,200", 4200.
 * Strips all non-numeric chars except the decimal point.
 */
function parsePrice(priceStr) {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  return parseFloat(String(priceStr).replace(/[^0-9.]/g, "")) || 0;
}

/**
 * Format a number as a EUR price string: €2,500.00
 * Falls back gracefully if the global formatEUR from api.js exists.
 */
function _formatEUR(amount) {
  if (typeof formatEUR === "function") return formatEUR(amount);
  return "\u20ac" + Number(amount).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Parse a Postgres daterange string like "[2026-04-30,2026-05-10)"
 * Returns { start: Date|null, end: Date|null }
 */
function _parseDateRange(str) {
  if (typeof parseDateRange === "function") return parseDateRange(str);
  if (!str) return { start: null, end: null };
  var clean = str.replace(/[\[\]\(\)]/g, "");
  var parts = clean.split(",");
  return {
    start: parts[0] ? new Date(parts[0].trim()) : null,
    end:   parts[1] ? new Date(parts[1].trim()) : null
  };
}

/**
 * Days between two Date objects (inclusive start, exclusive end).
 */
function _daysBetween(start, end) {
  if (typeof daysBetween === "function") return daysBetween(start, end);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Trim a Postgres time string "10:00:00+00" → "10:00"
 */
function formatTime(timeStr) {
  if (!timeStr) return "--:--";
  return String(timeStr).substring(0, 5);
}

/**
 * Build 2-letter initials from an airline name e.g. "Air Algerie" → "AA"
 */
function airlineInitials(name) {
  if (!name) return "\u2708";
  return name.split(" ")
    .map(function (w) { return w[0] || ""; })
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Load traveller counts saved by the search page.
 * Falls back to trip data if the global helper is missing.
 */
function _loadTravellerData(trip) {
  if (typeof loadTravellerData === "function") {
    var counts = loadTravellerData();
    // Prefer session data if it looks valid
    if (counts && (counts.adults > 0 || counts.children >= 0)) return counts;
  }
  // Fallback: use the trip's own passenger counts
  return {
    adults:   trip ? (trip.adults   || 1) : 1,
    children: trip ? (trip.children || 0) : 0,
    rooms:    trip ? (trip.room     || 1) : 1
  };
}

/* ── Populate one flight row ───────────────────────────────── */

/**
 * @param {string} direction  "outbound" | "return"
 * @param {object} flight     outbound_flight or return_flight from API
 */
function populateFlight(direction, flight) {
  if (!flight || !Object.keys(flight).length) return;

  var p = direction; // prefix

  // Logo bubble: initials of airline name
  var logoEl = document.getElementById(p + "-logo");
  if (logoEl) logoEl.textContent = airlineInitials(flight.company);

  setText(p + "-airline",     flight.company    || "—");
  setText(p + "-code",        (flight.flight_code || "—") + " \u00b7 " + (flight.class || "Economy"));
  setText(p + "-dep-time",    formatTime(flight.departure_time));
  setText(p + "-dep-airport", flight.departure_location || "—");
  setText(p + "-arr-time",    formatTime(flight.arrival_time));
  setText(p + "-arr-airport", flight.arrival_location   || "—");
  setText(p + "-duration",    flight.duration   || "—");
  setText(p + "-stops",       flight.is_direct  ? "Direct" : "1+ Stop");
}

/* ── Main populate function ────────────────────────────────── */

function populateDetails(trip) {
  /* ── Date / duration ── */
  var dates  = _parseDateRange(trip.date || "");
  var days, nights;
  if (dates.start && dates.end) {
    days   = _daysBetween(dates.start, dates.end);
    nights = Math.max(days - 1, 0);
  } else {
    days   = trip.days   || 8;
    nights = trip.nights || 7;
  }

  /* ── Hotel ── */
  var hotel      = trip.hotel || {};
  // FIX: API returns hotel.rating, not hotel.stars
  var hotelName  = hotel.name   || trip.accommodation || "Hotel";
  var hotelStars = hotel.rating || hotel.stars        || 5;
  var hotelImg   = hotel.img    || null;

  /* ── Media ── */
  var tripImage = (trip.media && trip.media.length > 0)
    ? trip.media[0]
    : (trip.image || null);

  /* ── Travellers ── */
  var counts      = _loadTravellerData(trip);
  var totalPeople = counts.adults + counts.children;
  var travStr     = counts.adults + (counts.adults === 1 ? " Adult" : " Adults");
  if (counts.children > 0) {
    travStr += " & " + counts.children + (counts.children === 1 ? " Child" : " Children");
  }

  /* ── Page title ── */
  document.title = "MakeMYtrip - " + (trip.name || "Trip Details");

  /* ── Hero banner ── */
  setText("hero-title", trip.name || trip.title || "Trip Details");
  setText("hero-subtitle", days + " Days / " + nights + " Nights \u00a0\u00b7\u00a0 " + travStr);

  var heroImage = document.getElementById("hero-image");
  if (heroImage && tripImage) {
    heroImage.src = tripImage;
    heroImage.alt = trip.name || "Trip";
  }

  /* ── Flight rows ── */
  populateFlight("outbound", trip.outbound_flight || {});
  populateFlight("return",   trip.return_flight   || {});

  /* ── Hotel card ── */
  setText("hotel-name", hotelName);

  var hotelStarsEl = document.getElementById("hotel-stars");
  if (hotelStarsEl) {
    hotelStarsEl.textContent =
      "\u2605".repeat(hotelStars) +
      "\u2606".repeat(Math.max(0, 5 - hotelStars));
  }

  var hotelImageEl = document.getElementById("hotel-image");
  if (hotelImageEl && hotelImg) {
    hotelImageEl.src = hotelImg;
    hotelImageEl.alt = hotelName;
  }

  // Address: use hotel city / country if no dedicated address field
  var addressText = hotel.address
    || (trip.name ? trip.name + (trip.country ? ", " + trip.country : "") : "—");
  setText("hotel-address-text", addressText);

  // Room type / description (use hotel data if available, else generic)
  setText("hotel-room-type", hotel.room_type || "Standard Room");
  setText("hotel-room-desc", hotel.room_desc || "Comfortable room with hotel amenities");

  /* ── Price sidebar ── */
  var price      = parsePrice(trip.price);
  var hotelCost  = Math.round(price * 0.70);
  var flightCost = Math.round(price * 0.20);
  var taxesCost  = price - hotelCost - flightCost;

  setText("label-flights",      "Flights (" + travStr + ")");
  setText("label-hotel",        "Hotel (" + nights + " Night" + (nights !== 1 ? "s" : "") + ")");
  setText("label-total-people", "All inclusive for " + totalPeople + (totalPeople === 1 ? " person" : " people"));
  setText("price-flights",      _formatEUR(flightCost));
  setText("price-hotel",        _formatEUR(hotelCost));
  setText("price-taxes",        _formatEUR(taxesCost));
  setText("price-total",        _formatEUR(price));

  /* ── Confirm button ── */
  var confirmBtn = document.querySelector(".btn-confirm");
  if (confirmBtn) {
    confirmBtn.onclick = function () {
      if (typeof saveTripCache      === "function") saveTripCache(trip);
      if (typeof saveTravellerData  === "function") saveTravellerData(counts);

      window.location.href = "booking.html"
        + "?trip_id=" + encodeURIComponent(trip.id || "")
        + "&price="   + price
        + "&name="    + encodeURIComponent(trip.name || "Trip");
    };
  }
}

/* ── Load & init ───────────────────────────────────────────── */

async function loadTripDetails() {
  var selectedTrip = null;
  try {
    selectedTrip = JSON.parse(sessionStorage.getItem("selectedTrip"));
  } catch (e) {
    console.error("Could not parse selectedTrip from sessionStorage:", e);
  }

  if (selectedTrip) {
    populateDetails(selectedTrip);
  } else {
    console.warn("No selectedTrip in sessionStorage. Showing placeholder content.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadTripDetails();
});

function confirmSelection() {
  // Implementation for confirming selection
  alert("Selection confirmed!");
  var selectedTrip = JSON.parse(sessionStorage.getItem("selectedTrip"));
  if (selectedTrip) {
    // Save trip details to sessionStorage for booking page
    sessionStorage.setItem("confirmedTrip", JSON.stringify(selectedTrip));
    // Redirect to booking page
    window.location.href = "booking.html";
  } else {
    alert("No trip selected to confirm.");
  }
}