/* ============================================================
   MakeMYtrip — Search Results JavaScript
   js/search.js
   Depends on: api.js (loaded before this script)
   ============================================================ */

/* ─────────────────────────────────────────────
   FALLBACK DATASET  (used when API is offline)
   Now includes LOCATION field for client-side filtering
   ───────────────────────────────────────────── */
var fallbackDb = [
  {
    id: 1, title: "Positano Coastal Retreat", type: "coastal", location: "italy",
    price: 4850, pricePerPerson: 2425, days: 8, nights: 7,
    rating: "5", ratingScore: 4.9, flight: "direct",
    badge: "Cliff-side", signature: true,
    accommodation: "Le Sirenuse Hotel",
    includes: ["Flights", "Hotel", "Transfers"],
    features: ["Le Sirenuse 5★ — Deluxe Sea View Suite", "Daily Italian breakfast at La Sponda restaurant", "Private boat day-trip to Capri"],
    image: "https://pohcdn.com/sites/default/files/styles/paragraph__live_banner__lb_image__1880bp/public/live_banner/positano.jpg"
  },
  {
    id: 2, title: "Amalfi Coast Exclusive", type: "coastal", location: "italy",
    price: 6200, pricePerPerson: 3100, days: 10, nights: 9,
    rating: "5", ratingScore: 4.8, flight: "business",
    badge: "Exclusive", signature: true,
    accommodation: "Hotel Santa Caterina",
    includes: ["Business Class", "Hotel", "Yacht Day"],
    features: ["Hotel Santa Caterina 5★ — Cliff Suite with terrace", "Private yacht excursion to Ravello", "Michelin-starred dinner experience"],
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80"
  },
  {
    id: 3, title: "Rome & Tuscany Grand Tour", type: "cultural", location: "italy",
    price: 3600, pricePerPerson: 1800, days: 10, nights: 9,
    rating: "4", ratingScore: 4.6, flight: "direct",
    badge: "Cultural", signature: false,
    accommodation: "Hotel de Russie, Rome",
    includes: ["Flights", "Hotel", "Guide"],
    features: ["Hotel de Russie 4★ — Standard Deluxe Room", "Vatican private tour with art historian guide", "Chianti wine estate day trip with tasting"],
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80"
  },
  {
    id: 4, title: "Venice & Lake Como Escape", type: "romantic", location: "italy",
    price: 5400, pricePerPerson: 2700, days: 9, nights: 8,
    rating: "5", ratingScore: 4.7, flight: "direct",
    badge: "Romantic", signature: true,
    accommodation: "Aman Venice",
    includes: ["Flights", "Hotel", "Gondola"],
    features: ["Aman Venice 5★ — Grand Canal Suite", "Private gondola sunset tour in Venice", "Seaplane transfer Lake Como — Como waterfront"],
    image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80"
  },
  {
    id: 5, title: "Sicily Heritage & Food Tour", type: "cultural", location: "italy",
    price: 2900, pricePerPerson: 1450, days: 8, nights: 7,
    rating: "boutique", ratingScore: 4.5, flight: "direct",
    badge: "Heritage", signature: false,
    accommodation: "Boutique Hotel Eremo",
    includes: ["Flights", "Hotel", "Cooking"],
    features: ["Eremo della Giubiliana — Boutique Guesthouse", "Valley of the Temples private archaeological tour", "Sicilian street food walking tour in Palermo"],
    image: "https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=600&q=80"
  },
  {
    id: 6, title: "Sardinia Luxury Beach Week", type: "coastal", location: "italy",
    price: 5100, pricePerPerson: 2550, days: 8, nights: 7,
    rating: "5", ratingScore: 4.9, flight: "business",
    badge: "Beach & Sea", signature: true,
    accommodation: "Cala di Volpe",
    includes: ["Business Class", "Hotel", "Boat"],
    features: ["Cala di Volpe 5★ — Junior Suite Sea View", "Private speedboat & snorkelling excursion", "Sunset aperitivo on private beach terrace"],
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"
  },
  {
    id: 7, title: "Tokyo Neon & Tradition", type: "cultural", location: "japan",
    price: 4200, pricePerPerson: 2100, days: 10, nights: 9,
    rating: "5", ratingScore: 4.8, flight: "direct",
    badge: "Cultural", signature: true,
    accommodation: "Park Hyatt Tokyo",
    includes: ["Flights", "Hotel", "Rail Pass"],
    features: ["Park Hyatt Tokyo 5★ — Deluxe King with city view", "Guided visit to Meiji Shrine & Senso-ji Temple", "Bullet train day-trip to Mount Fuji"],
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80"
  },
  {
    id: 8, title: "Kyoto & Osaka Explorer", type: "cultural", location: "japan",
    price: 3800, pricePerPerson: 1900, days: 9, nights: 8,
    rating: "4", ratingScore: 4.6, flight: "direct",
    badge: "Explorer", signature: false,
    accommodation: "The Ritz-Carlton Kyoto",
    includes: ["Flights", "Hotel", "Guide"],
    features: ["Ritz-Carlton Kyoto 4★ — Garden Terrace Suite", "Fushimi Inari private walking tour at dawn", "Osaka street food tour in Dotonbori"],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80"
  },
  {
    id: 9, title: "Bali Paradise Retreat", type: "coastal", location: "bali",
    price: 3400, pricePerPerson: 1700, days: 8, nights: 7,
    rating: "5", ratingScore: 4.7, flight: "direct",
    badge: "Beach", signature: true,
    accommodation: "Four Seasons Jimbaran",
    includes: ["Flights", "Villa", "Spa"],
    features: ["Four Seasons Jimbaran 5★ — Ocean Villa", "Private sunrise trek to Mount Batur", "Balinese spa & wellness day package"],
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80"
  },
  {
    id: 10, title: "Paris Luxury Getaway", type: "romantic", location: "france",
    price: 5600, pricePerPerson: 2800, days: 7, nights: 6,
    rating: "5", ratingScore: 4.9, flight: "business",
    badge: "Romantic", signature: true,
    accommodation: "Le Meurice, Paris",
    includes: ["Business Class", "Hotel", "Dining"],
    features: ["Le Meurice 5★ — Suite Tuileries View", "Private after-hours Louvre guided tour", "Michelin 3-star dinner at Alain Ducasse"],
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80"
  }
];

/* ─────────────────────────────────────────────
   ACTIVE DATASET
   ───────────────────────────────────────────── */
var db = [];
var isApiData = false;

function calculateDynamicPrice(basePriceForTwo) {
  var pricePerPerson = Math.round(basePriceForTwo / 2);
  var adults = counts.adults;
  var children = counts.children;
  return Math.round(pricePerPerson * adults + pricePerPerson * 0.5 * children);
}

function calculatePricePerPerson(basePriceForTwo) {
  return Math.round(basePriceForTwo / 2);
}

/* ─────────────────────────────────────────────
   TRANSFORM API RESPONSE → card-compatible format
   ───────────────────────────────────────────── */
function transformApiTrip(trip) {
  var basePrice = parsePrice(trip.price);
  var dynamicTotal = calculateDynamicPrice(basePrice);
  var dates = parseDateRange(trip.date);
  var days = daysBetween(dates.start, dates.end);
  var nights = Math.max(days - 1, 0);
  var hotelName = (trip.hotel && trip.hotel.name) ? trip.hotel.name : "Hotel";
  var hotelStars = (trip.hotel && trip.hotel.stars) ? trip.hotel.stars : 0;
  var image = (trip.media && trip.media.length > 0) ? trip.media[0] : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80";

  return {
    id: trip.id,
    title: trip.name || "Unnamed Trip",
    type: "all",
    location: (trip.name || "").toLowerCase(),
    price: dynamicTotal,
    basePrice: basePrice, /* Keep base price for reference */
    pricePerPerson: calculatePricePerPerson(basePrice),
    days: days,
    nights: nights,
    rating: String(hotelStars),
    ratingScore: hotelStars,
    flight: "direct",
    badge: hotelName,
    signature: hotelStars >= 5,
    accommodation: hotelName,
    includes: ["Hotel", "Transfers"],
    features: [
      hotelName + " " + hotelStars + "★",
      trip.descripiton || "An unforgettable experience awaits",
      days + " days / " + nights + " nights"
    ],
    image: image
  };
}

/* ─────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────── */
var state = {
  minPrice: 0,
  maxPrice: Infinity,
  ratings: [],
  tripType: "all",
  flight: "any"
};

/* ─────────────────────────────────────────────
   URL PARAMS — populate search pills + change travellers
   ───────────────────────────────────────────── */
var counts = loadTravellerData();

function populateSearchBar() {
  var params = getUrlParams();
  
  /* Inputs */
  var inpWhere = document.getElementById("inp-where");
  if (inpWhere && params.where) inpWhere.value = decodeURIComponent(params.where);

  var inpCheckin = document.getElementById("inp-checkin");
  if (inpCheckin && params.checkin) inpCheckin.value = decodeURIComponent(params.checkin);
  
  var inpCheckout = document.getElementById("inp-checkout");
  if (inpCheckout && params.checkout) inpCheckout.value = decodeURIComponent(params.checkout);

  /* Travellers */
  if (params.adults || params.children || params.rooms) {
    counts.adults = parseInt(params.adults) || counts.adults;
    counts.children = parseInt(params.children) || counts.children;
    counts.rooms = parseInt(params.rooms) || counts.rooms;
    saveTravellerData(counts);
  }

  var el;
  el = document.getElementById("count-adults"); if (el) el.textContent = counts.adults;
  el = document.getElementById("count-children"); if (el) el.textContent = counts.children;
  el = document.getElementById("count-rooms"); if (el) el.textContent = counts.rooms;

  updateTravellersInput();

  /* Results header — show the actual search term */
  var titleEl = document.querySelector(".results-title");
  if (titleEl) {
    if (params.where) {
      /* Capitalize first letter of search term */
      var dest = decodeURIComponent(params.where);
      titleEl.textContent = "Trips to " + dest.charAt(0).toUpperCase() + dest.slice(1);
    } else {
      titleEl.textContent = "All Available Trips";
    }
  }
}

/* ── Travellers Dropdown Functions ── */
function updateTravellersInput() {
  var parts = [];
  if (counts.adults > 0)   parts.push(counts.adults   + (counts.adults   === 1 ? " Adult"    : " Adults"));
  if (counts.children > 0) parts.push(counts.children + (counts.children === 1 ? " Child"    : " Children"));
  parts.push(counts.rooms  + (counts.rooms  === 1 ? " Room"    : " Rooms"));
  var el = document.getElementById("inp-travellers");
  if (el) el.value = parts.join(", ");
  saveTravellerData(counts);
}

function changeCount(type, delta) {
  var min = (type === "adults" || type === "rooms") ? 1 : 0;
  counts[type] = Math.max(min, counts[type] + delta);

  if (type === "adults" || type === "rooms") {
    var minR = minRoomsForAdults(counts.adults);
    if (counts.rooms < minR) counts.rooms = minR;
    var roomsEl = document.getElementById("count-rooms");
    if (roomsEl) roomsEl.textContent = counts.rooms;
  }

  var el = document.getElementById("count-" + type);
  if (el) el.textContent = counts[type];
  updateTravellersInput();
}

function toggleTravellersDropdown() {
  var d = document.getElementById("travellers-dropdown");
  if (d) d.classList.toggle("open");
}

document.addEventListener("click", function (e) {
  var field = document.querySelector(".travellers-field");
  var d = document.getElementById("travellers-dropdown");
  if (field && d && !field.contains(e.target)) {
    d.classList.remove("open");
  }
});

/* ─────────────────────────────────────────────
   RANGE SLIDER
   ───────────────────────────────────────────── */
var rangeMin, rangeMax;

function initSlider() {
  rangeMin = document.getElementById("range-min");
  rangeMax = document.getElementById("range-max");
  if (!rangeMin || !rangeMax) return;

  rangeMin.addEventListener("input", function () {
    if (parseInt(rangeMin.value) >= parseInt(rangeMax.value)) rangeMin.value = parseInt(rangeMax.value) - 500;
    updateSliderFill();
  });

  rangeMax.addEventListener("input", function () {
    if (parseInt(rangeMax.value) <= parseInt(rangeMin.value)) rangeMax.value = parseInt(rangeMin.value) + 500;
    updateSliderFill();
  });

  updateSliderFill();
}

function updateSliderFill() {
  if (!rangeMin || !rangeMax) return;
  var min = parseInt(rangeMin.value), max = parseInt(rangeMax.value);
  var total = parseInt(rangeMax.max) - parseInt(rangeMin.min);
  var leftPct  = ((min - parseInt(rangeMin.min)) / total) * 100;
  var rightPct = ((max - parseInt(rangeMin.min)) / total) * 100;
  var fill = document.querySelector(".slider-fill");
  if (fill) { fill.style.left = leftPct + "%"; fill.style.width = (rightPct - leftPct) + "%"; }
  var minLbl = document.getElementById("price-min-label");
  var maxLbl = document.getElementById("price-max-label");
  if (minLbl) minLbl.textContent = "€" + min.toLocaleString();
  if (maxLbl) maxLbl.textContent = max >= 20000 ? "€12,000+" : "€" + max.toLocaleString();

  state.minPrice = min;
  state.maxPrice = max >= 20000 ? Infinity : max;
  applyFilters();
}

/* ─────────────────────────────────────────────
   FILTER HELPERS
   ───────────────────────────────────────────── */
function toggleRating(el) {
  el.classList.toggle("selected");
  var rating = el.dataset.rating;
  if (el.classList.contains("selected")) {
    if (!state.ratings.includes(rating)) state.ratings.push(rating);
  } else {
    state.ratings = state.ratings.filter(function(r){ return r !== rating; });
  }
  applyFilters();
}

function selectType(el) {
  document.querySelectorAll(".type-chip").forEach(function(c){ c.classList.remove("selected"); });
  el.classList.add("selected");
  state.tripType = el.dataset.type;
  applyFilters();
}

function selectFlight(el) {
  document.querySelectorAll(".flight-option").forEach(function(f){ f.classList.remove("selected"); });
  el.classList.add("selected");
  state.flight = el.dataset.flight;
  applyFilters();
}

/* ─────────────────────────────────────────────
   FILTER & RENDER
   ───────────────────────────────────────────── */
function applyFilters() {
  var results = db.filter(function(item) {
    if (item.price < state.minPrice) return false;
    if (state.maxPrice !== Infinity && item.price > state.maxPrice) return false;
    if (state.ratings.length > 0 && !state.ratings.includes(String(item.rating))) return false;
    if (state.tripType !== "all" && item.type !== state.tripType) return false;
    if (state.flight !== "any" && item.flight !== state.flight) return false;
    return true;
  });

  var sortEl = document.getElementById("sort-select");
  if (sortEl) {
    var sort = sortEl.value;
    if (sort === "price-asc")  results.sort(function(a,b){ return a.price - b.price; });
    if (sort === "price-desc") results.sort(function(a,b){ return b.price - a.price; });
    if (sort === "rating")     results.sort(function(a,b){ return b.ratingScore - a.ratingScore; });
    if (sort === "duration")   results.sort(function(a,b){ return b.days - a.days; });
  }

  renderCards(results);
  renderActiveFilters();
  var countEl = document.getElementById("results-count");
  if (countEl) countEl.textContent = results.length;
}

function renderCards(data) {
  var container = document.getElementById("cards-container");
  var noResults = document.getElementById("no-results");
  if (!container || !noResults) return;

  if (!data || data.length === 0) {
    container.innerHTML = "";
    noResults.classList.add("show");
    return;
  }
  noResults.classList.remove("show");

  var travStr = counts.adults + (counts.adults === 1 ? " adult" : " adults");
  if (counts.children > 0) {
    travStr += " & " + counts.children + (counts.children === 1 ? " child" : " children");
  }

  container.innerHTML = data.map(function(item, i) {
    return ''
    + '<div class="experience-card" style="animation-delay:' + (i * 0.06) + 's">'
      + '<div class="card-img-wrap">'
        + '<img class="card-img" src="' + item.image + '" alt="' + item.title + '" loading="lazy">'
        + (item.signature ? '<div class="signature-badge">✦ Signature Collection</div>' : '')
        + '<button class="wishlist-btn" onclick="toggleWishlist(this)" title="Save">♡</button>'
      + '</div>'
      + '<div class="card-body">'
        + '<div class="card-top">'
          + '<div class="card-title">' + item.title + '</div>'
          + '<div class="info-box">'
            + '<div class="info-segment"><div class="info-seg-label">Rating</div><div class="info-seg-value">' + item.ratingScore + '</div><div class="rating-stars">' + getStars(item.rating) + '</div></div>'
            + '<div class="info-segment"><div class="info-seg-label">Type</div><div class="info-seg-value blue" style="font-size:11px;text-transform:capitalize">' + item.type + '</div><div style="font-size:10px;color:var(--muted)">' + item.badge + '</div></div>'
            + '<div class="info-segment"><div class="info-seg-label">Total</div><div class="info-seg-value blue">€' + item.price.toLocaleString() + '</div><div style="font-size:10px;color:var(--muted)">' + travStr + '</div></div>'
          + '</div>'
        + '</div>'
        + '<div class="card-meta">'
          + '<div class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' + item.days + ' Days / ' + item.nights + ' Nights</div>'
          + '<div class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.12 2.18 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006 6l.56-.56a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>' + item.includes.join(" · ") + '</div>'
        + '</div>'
        + '<div class="card-features">'
          + item.features.map(function(f){ return '<div class="feature-row"><div class="feature-icon">🏨</div><span>' + f + '</span></div>'; }).join("")
        + '</div>'
        + '<div class="card-footer">'
          + '<div class="price-wrap"><div class="price-from">From €' + item.pricePerPerson.toLocaleString() + ' / person</div><div class="price-main">€' + item.price.toLocaleString() + '</div><div class="price-sub">total for ' + travStr + '</div></div>'
          + '<button class="view-btn" onclick="viewDetails(' + item.id + ')">View Details →</button>'
        + '</div>'
      + '</div>'
    + '</div>';
  }).join("");
}

function getStars(rating) {
  if (rating === "boutique") return "🏛";
  var n = parseInt(rating);
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function renderActiveFilters() {
  var container = document.getElementById("active-filters");
  if (!container) return;
  var tags = [];

  if (state.minPrice > 0 || state.maxPrice !== Infinity) {
    var minStr = "€" + state.minPrice.toLocaleString();
    var maxStr = state.maxPrice === Infinity ? "€12,000+" : "€" + state.maxPrice.toLocaleString();
    tags.push({ label: "Price: " + minStr + " – " + maxStr, action: "clearPrice" });
  }
  state.ratings.forEach(function(r) {
    var labels = { "5": "5★ Luxury", "4": "4★ Premium", "boutique": "Boutique" };
    tags.push({ label: labels[r] || r, action: "removeRating:" + r });
  });
  if (state.tripType !== "all") tags.push({ label: "Type: " + state.tripType, action: "clearType" });
  if (state.flight !== "any")  tags.push({ label: state.flight === "direct" ? "Direct Flights" : "Business Class", action: "clearFlight" });

  container.innerHTML = tags.map(function(t) {
    return '<div class="active-filter-tag">' + t.label + '<button onclick="removeFilter(\'' + t.action + '\')">×</button></div>';
  }).join("");
}

function removeFilter(action) {
  if (action === "clearPrice") {
    if (rangeMin) rangeMin.value = 0;
    if (rangeMax) rangeMax.value = 20000;
    updateSliderFill();
  } else if (action.indexOf("removeRating:") === 0) {
    var r = action.split(":")[1];
    state.ratings = state.ratings.filter(function(x){ return x !== r; });
    var el = document.querySelector('[data-rating="' + r + '"]');
    if (el) el.classList.remove("selected");
  } else if (action === "clearType") {
    state.tripType = "all";
    document.querySelectorAll(".type-chip").forEach(function(c){ c.classList.remove("selected"); });
    var allChip = document.querySelector('[data-type="all"]');
    if (allChip) allChip.classList.add("selected");
  } else if (action === "clearFlight") {
    state.flight = "any";
    document.querySelectorAll(".flight-option").forEach(function(f){ f.classList.remove("selected"); });
    var anyFlight = document.querySelector('[data-flight="any"]');
    if (anyFlight) anyFlight.classList.add("selected");
  }
  applyFilters();
}

function clearFilters() {
  if (rangeMin) rangeMin.value = 0;
  if (rangeMax) rangeMax.value = 20000;
  updateSliderFill();
  state.ratings  = [];
  state.tripType = "all";
  state.flight   = "any";
  document.querySelectorAll(".rating-option").forEach(function(el){ el.classList.remove("selected"); });
  document.querySelectorAll(".type-chip").forEach(function(c){ c.classList.toggle("selected", c.dataset.type === "all"); });
  document.querySelectorAll(".flight-option").forEach(function(f){ f.classList.toggle("selected", f.dataset.flight === "any"); });
  applyFilters();
}

function toggleWishlist(btn) {
  btn.classList.toggle("liked");
  btn.textContent = btn.classList.contains("liked") ? "♥" : "♡";
}

function viewDetails(id) {
  /* Cache the trip data in localStorage before navigating */
  var trip = null;
  for (var i = 0; i < db.length; i++) {
    if (db[i].id === id) { trip = db[i]; break; }
  }
  if (trip) saveTripCache(trip);
  window.location.href = "details.html?id=" + id;
}

/* ─────────────────────────────────────────────
   SEARCH LOGIC FIX: Filter fallback data by destination
   ───────────────────────────────────────────── */
function filterByDestination(dataset, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return dataset;
  var term = searchTerm.toLowerCase().trim();
  var filtered = dataset.filter(function(item) {
    /* Match against title, location, badge, accommodation */
    return (item.title && item.title.toLowerCase().indexOf(term) !== -1)
        || (item.location && item.location.toLowerCase().indexOf(term) !== -1)
        || (item.badge && item.badge.toLowerCase().indexOf(term) !== -1)
        || (item.accommodation && item.accommodation.toLowerCase().indexOf(term) !== -1);
  });
  return filtered;
}

/* ─────────────────────────────────────────────
   LOAD DATA — API or fallback with PROPER filtering
   ───────────────────────────────────────────── */
async function loadSearchData() {
  var params = getUrlParams();
  var container = document.getElementById("cards-container");

  /* Show loading state */
  if (container) container.innerHTML = loadingHTML("Searching trips...");

  /* Try API search if we have URL params from homepage */
  if (params.where && params.checkin && params.checkout) {
    try {
      var apiResults = await searchTripsAPI({
        location:  params.where,
        startdate: params.checkin,
        enddate:   params.checkout,
        numadults: parseInt(params.adults) || 1,
        numchild:  parseInt(params.children) || 0
      });

      if (apiResults && apiResults.length > 0) {
        db = apiResults.map(transformApiTrip);
        isApiData = true;
        showToast(db.length + " trips found for " + decodeURIComponent(params.where), "success", 3000);
        applyFilters();
        return;
      }
    } catch (err) {
      console.warn("Search API call failed, trying visual trips:", err.message);
    }
  }

  /* Fallback: try visual trips from API */
  try {
    var visualTrips = await fetchVisualTrips();
    if (visualTrips && visualTrips.length > 0) {
      db = visualTrips.map(transformApiTrip);
      isApiData = true;
      /* Still filter by search term if provided */
      if (params.where) {
        db = filterByDestination(db, params.where);
      }
      if (db.length > 0) {
        showToast(db.length + " trips found", "success", 2000);
      } else {
        showToast("No trips match \"" + decodeURIComponent(params.where || "") + "\"", "info");
      }
      applyFilters();
      return;
    }
  } catch (err) {
    console.warn("Visual trips API failed, using fallback data:", err.message);
    showToast("Using offline data — backend is not connected", "warning", 5000);
  }

  /* Final fallback: use hardcoded data — FILTER BY SEARCH TERM */
  db = fallbackDb.map(function(item) {
    var clone = Object.assign({}, item);
    clone.basePrice = clone.price;
    clone.price = calculateDynamicPrice(clone.basePrice);
    clone.pricePerPerson = calculatePricePerPerson(clone.basePrice);
    return clone;
  });

  if (params.where) {
    db = filterByDestination(db, params.where);
    if (db.length === 0) {
      /* No matches in fallback — show a toast and display all */
      showToast('No trips found for "' + decodeURIComponent(params.where) + '" — showing all available trips', "info", 5000);
      db = fallbackDb.map(function(item) {
        var clone = Object.assign({}, item);
        clone.basePrice = clone.price;
        clone.price = calculateDynamicPrice(clone.basePrice);
        clone.pricePerPerson = calculatePricePerPerson(clone.basePrice);
        return clone;
      });
    }
  }

  isApiData = false;
  applyFilters();
}

function handleSearchUpdate() {
  var where     = document.getElementById("inp-where")    ? document.getElementById("inp-where").value    : "";
  var checkin   = document.getElementById("inp-checkin")  ? document.getElementById("inp-checkin").value  : "";
  var checkout  = document.getElementById("inp-checkout") ? document.getElementById("inp-checkout").value : "";

  if (!where.trim()) {
    var inp = document.getElementById("inp-where");
    if (inp) { inp.style.border = "1px solid #ef4444"; setTimeout(function(){ inp.style.border=""; }, 1500); }
    showToast("Please enter a destination", "warning");
    return;
  }

  saveTravellerData(counts);

  window.location.href = "search.html?where=" + encodeURIComponent(where)
                         + "&checkin="  + encodeURIComponent(checkin)
                         + "&checkout=" + encodeURIComponent(checkout)
                         + "&adults="   + counts.adults
                         + "&children=" + counts.children
                         + "&rooms="    + counts.rooms;
}

/* ── Autocomplete logic ── */
function initAutocomplete() {
  var inp = document.getElementById("inp-where");
  var list = document.getElementById("autocomplete-where");
  if (!inp || !list) return;

  /* Extract unique locations from fallbackDb dynamically */
  var rawDestinations = fallbackDb.map(function(item) {
    return item.location;
  });
  /* Unique map and capitalize */
  var destinations = rawDestinations.filter(function(v, i, a) { return a.indexOf(v) === i; }).map(function(v) {
    return v.charAt(0).toUpperCase() + v.slice(1);
  });

  /* Hide when clicking outside */
  document.addEventListener("click", function(e) {
    if (!inp.contains(e.target) && !list.contains(e.target)) {
      list.classList.remove("active");
    }
  });

  inp.addEventListener("input", function() {
    var val = this.value.trim().toLowerCase();
    list.innerHTML = "";
    if (!val) {
      list.classList.remove("active");
      return;
    }
    var matches = destinations.filter(function(d) {
      return d.toLowerCase().indexOf(val) !== -1;
    });

    if (matches.length > 0) {
      list.classList.add("active");
      matches.forEach(function(match) {
        var li = document.createElement("li");
        li.className = "autocomplete-item";
        li.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + match;
        li.addEventListener("click", function() {
          inp.value = match;
          list.classList.remove("active");
        });
        list.appendChild(li);
      });
    } else {
      list.classList.remove("active");
    }
  });

  /* Show on focus if it has value */
  inp.addEventListener("focus", function() {
    if (this.value.trim() && list.children.length > 0) {
      list.classList.add("active");
    }
  });
}

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  initSlider();
  populateSearchBar();
  initAutocomplete();

  var sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.addEventListener("change", applyFilters);

  var updateBtn = document.getElementById("btn-search-update");
  if (updateBtn) updateBtn.addEventListener("click", handleSearchUpdate);

  loadSearchData();
});
