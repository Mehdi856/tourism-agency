/* ============================================================
   MakeMYtrip — Search Results JavaScript
   js/search.js
   ============================================================ */

/* ─────────────────────────────────────────────
   DATASET
   ───────────────────────────────────────────── */
var db = [
  {
    id: 1, title: "Positano Coastal Retreat", type: "coastal",
    price: 4850, pricePerPerson: 2425, days: 8, nights: 7,
    rating: "5", ratingScore: 4.9, flight: "direct",
    badge: "Cliff-side", signature: true,
    accommodation: "Le Sirenuse Hotel",
    includes: ["Flights", "Hotel", "Transfers"],
    features: ["Le Sirenuse 5★ — Deluxe Sea View Suite", "Daily Italian breakfast at La Sponda restaurant", "Private boat day-trip to Capri"],
    image: "https://pohcdn.com/sites/default/files/styles/paragraph__live_banner__lb_image__1880bp/public/live_banner/positano.jpg"
  },
  {
    id: 2, title: "Amalfi Coast Exclusive", type: "coastal",
    price: 6200, pricePerPerson: 3100, days: 10, nights: 9,
    rating: "5", ratingScore: 4.8, flight: "business",
    badge: "Exclusive", signature: true,
    accommodation: "Hotel Santa Caterina",
    includes: ["Business Class", "Hotel", "Yacht Day"],
    features: ["Hotel Santa Caterina 5★ — Cliff Suite with terrace", "Private yacht excursion to Ravello", "Michelin-starred dinner experience"],
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80"
  },
  {
    id: 3, title: "Rome & Tuscany Grand Tour", type: "cultural",
    price: 3600, pricePerPerson: 1800, days: 10, nights: 9,
    rating: "4", ratingScore: 4.6, flight: "direct",
    badge: "Cultural", signature: false,
    accommodation: "Hotel de Russie, Rome",
    includes: ["Flights", "Hotel", "Guide"],
    features: ["Hotel de Russie 4★ — Standard Deluxe Room", "Vatican private tour with art historian guide", "Chianti wine estate day trip with tasting"],
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80"
  },
  {
    id: 4, title: "Venice & Lake Como Escape", type: "romantic",
    price: 5400, pricePerPerson: 2700, days: 9, nights: 8,
    rating: "5", ratingScore: 4.7, flight: "direct",
    badge: "Romantic", signature: true,
    accommodation: "Aman Venice",
    includes: ["Flights", "Hotel", "Gondola"],
    features: ["Aman Venice 5★ — Grand Canal Suite", "Private gondola sunset tour in Venice", "Seaplane transfer Lake Como — Como waterfront"],
    image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80"
  },
  {
    id: 5, title: "Sicily Heritage & Food Tour", type: "cultural",
    price: 2900, pricePerPerson: 1450, days: 8, nights: 7,
    rating: "boutique", ratingScore: 4.5, flight: "direct",
    badge: "Heritage", signature: false,
    accommodation: "Boutique Hotel Eremo",
    includes: ["Flights", "Hotel", "Cooking"],
    features: ["Eremo della Giubiliana — Boutique Guesthouse", "Valley of the Temples private archaeological tour", "Sicilian street food walking tour in Palermo"],
    image: "https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=600&q=80"
  },
  {
    id: 6, title: "Sardinia Luxury Beach Week", type: "coastal",
    price: 5100, pricePerPerson: 2550, days: 8, nights: 7,
    rating: "5", ratingScore: 4.9, flight: "business",
    badge: "Beach & Sea", signature: true,
    accommodation: "Cala di Volpe",
    includes: ["Business Class", "Hotel", "Boat"],
    features: ["Cala di Volpe 5★ — Junior Suite Sea View", "Private speedboat & snorkelling excursion", "Sunset aperitivo on private beach terrace"],
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"
  }
];

/* ─────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────── */
var state = {
  minPrice: 0,
  maxPrice: Infinity,
  ratings: ["5"],
  tripType: "all",
  flight: "direct"
};

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

function renderCards(results) {
  var container  = document.getElementById("cards-container");
  var noResults  = document.getElementById("no-results");
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = "";
    if (noResults) noResults.classList.add("show");
    return;
  }
  if (noResults) noResults.classList.remove("show");

  container.innerHTML = results.map(function(item, i) {
    return '<div class="experience-card" style="animation-delay:' + (i * 0.06) + 's">'
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
            + '<div class="info-segment"><div class="info-seg-label">Total</div><div class="info-seg-value blue">€' + item.price.toLocaleString() + '</div><div style="font-size:10px;color:var(--muted)">2 adults</div></div>'
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
          + '<div class="price-wrap"><div class="price-from">From €' + item.pricePerPerson.toLocaleString() + ' / person</div><div class="price-main">€' + item.price.toLocaleString() + '</div><div class="price-sub">total for 2 adults</div></div>'
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
  state.ratings  = ["5"];
  state.tripType = "all";
  state.flight   = "direct";
  document.querySelectorAll(".rating-option").forEach(function(el){ el.classList.toggle("selected", el.dataset.rating === "5"); });
  document.querySelectorAll(".type-chip").forEach(function(c){ c.classList.toggle("selected", c.dataset.type === "all"); });
  document.querySelectorAll(".flight-option").forEach(function(f){ f.classList.toggle("selected", f.dataset.flight === "direct"); });
  applyFilters();
}

function toggleWishlist(btn) {
  btn.classList.toggle("liked");
  btn.textContent = btn.classList.contains("liked") ? "♥" : "♡";
}

function viewDetails(id) {
  window.location.href = "details.html?id=" + id;
}

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  initSlider();

  var sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.addEventListener("change", applyFilters);

  applyFilters();
});
