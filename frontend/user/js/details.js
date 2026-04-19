/* ============================================================
   MakeMYtrip — Trip Details JavaScript
   js/details.js
   Depends on: api.js (loaded before this script)
   ============================================================ */

/* ── Populate page with trip data ──────────────────────────── */
function populateDetails(trip) {
  var price = parsePrice(trip.price);
  var dates = parseDateRange(trip.date || "");
  var days, nights;
  if (dates.start && dates.end) {
    days = daysBetween(dates.start, dates.end);
    nights = Math.max(days - 1, 0);
  } else {
    /* Fallback: use card-format data */
    days = trip.days || 8;
    nights = trip.nights || 7;
  }
  var hotelName = (trip.hotel && trip.hotel.name) ? trip.hotel.name : (trip.accommodation || "Hotel");
  var hotelStars = (trip.hotel && trip.hotel.stars) ? trip.hotel.stars : 5;
  var hotelImg = (trip.hotel && trip.hotel.img) ? trip.hotel.img : null;
  var tripImage = (trip.media && trip.media.length > 0) ? trip.media[0] : (trip.image || null);

  /* ── Hero Banner ── */
  var heroTitle = document.getElementById("hero-title");
  if (heroTitle) heroTitle.textContent = trip.name || trip.title || "Trip Details";

  var heroSubtitle = document.getElementById("hero-subtitle");
  if (heroSubtitle) heroSubtitle.textContent = days + " Days / " + nights + " Nights";

  var heroImage = document.getElementById("hero-image");
  if (heroImage && tripImage) {
    heroImage.src = tripImage;
    heroImage.alt = trip.name || trip.title || "Trip";
  }

  /* ── Update page title ── */
  document.title = "MakeMYtrip - " + (trip.name || trip.title || "Trip Details");

  /* ── Hotel Card ── */
  var hotelNameEl = document.getElementById("hotel-name");
  if (hotelNameEl) hotelNameEl.textContent = hotelName;

  var hotelStarsEl = document.getElementById("hotel-stars");
  if (hotelStarsEl) {
    hotelStarsEl.textContent = "★".repeat(hotelStars) + "☆".repeat(Math.max(0, 5 - hotelStars));
  }

  var hotelImageEl = document.getElementById("hotel-image");
  if (hotelImageEl && hotelImg) {
    hotelImageEl.src = hotelImg;
    hotelImageEl.alt = hotelName;
  }

  /* ── Calculate Traveller String ── */
  var counts = loadTravellerData();
  var totalPeople = counts.adults + counts.children;
  var travStr = counts.adults + (counts.adults === 1 ? " Adult" : " Adults");
  if (counts.children > 0) {
    travStr += " & " + counts.children + (counts.children === 1 ? " Child" : " Children");
  }

  /* ── Price Sidebar ── */
  if (!price && trip.price) price = trip.price;
  var hotelCost  = Math.round(price * 0.70);
  var flightCost = Math.round(price * 0.20);
  var taxesCost  = price - hotelCost - flightCost;

  var labelFlights = document.getElementById("label-flights");
  if (labelFlights) labelFlights.textContent = "Flights (" + travStr + ")";

  var labelHotel = document.getElementById("label-hotel");
  if (labelHotel) labelHotel.textContent = "Hotel (" + nights + " Nights)";

  var labelTotalPeople = document.getElementById("label-total-people");
  if (labelTotalPeople) labelTotalPeople.textContent = "All inclusive for " + totalPeople + (totalPeople === 1 ? " person" : " people");

  var priceFlights = document.getElementById("price-flights");
  if (priceFlights) priceFlights.textContent = formatEUR(flightCost);

  var priceHotel = document.getElementById("price-hotel");
  if (priceHotel) priceHotel.textContent = formatEUR(hotelCost);

  var priceTaxes = document.getElementById("price-taxes");
  if (priceTaxes) priceTaxes.textContent = formatEUR(taxesCost);

  var priceTotal = document.getElementById("price-total");
  if (priceTotal) priceTotal.textContent = formatEUR(price);

  /* ── Update "Confirm Selection" button to pass trip context ── */
  var confirmBtn = document.querySelector(".btn-confirm");
  if (confirmBtn) {
    confirmBtn.onclick = function () {
      /* Save trip data to localStorage for later pages */
      saveTripCache(trip);
      saveTravellerData(loadTravellerData());

      window.location.href = "booking.html?trip_id=" + (trip.id || "")
        + "&price=" + price
        + "&name=" + encodeURIComponent(trip.name || trip.title || "Trip");
    };
  }
}

/* ── Load trip data — from cache, API, or static ────────────── */
async function loadTripDetails() {
  var params = getUrlParams();
  var tripId = params.id;

  if (!tripId) {
    console.info("No trip ID in URL; showing static details page.");
    return;
  }

  /* 1. Try localStorage cache first (instant) */
  var cached = loadTripCache();
  if (cached && String(cached.id) === String(tripId)) {
    populateDetails(cached);
    showToast("Trip loaded from cache", "info", 2000);
    return;
  }

  /* 2. Try API */
  try {
    var trip = await fetchTripById(tripId);
    saveTripCache(trip); /* Cache for next time */
    populateDetails(trip);
    showToast("Trip details loaded", "success", 2000);
  } catch (err) {
    console.warn("Could not load trip #" + tripId + " from API:", err.message);
    showToast("Could not load trip details — showing default data", "warning", 4000);
    /* Keep static HTML fallback */
  }
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  /* Fallback: "Confirm Selection" still navigates if no API */
  var confirmBtn = document.querySelector(".btn-confirm");
  if (confirmBtn && !confirmBtn.onclick) {
    confirmBtn.addEventListener("click", function () {
      window.location.href = "booking.html";
    });
  }

  loadTripDetails();
});
