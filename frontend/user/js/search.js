// ── Global state ──────────────────────────────────────────────
var allTrips = []; // full unfiltered list loaded from session

var currentFilters = {
  priceMin: 0,
  priceMax: 20000,
  ratings: []   // empty = show all ratings
};

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  var params = JSON.parse(sessionStorage.getItem("searchParams"));
  var trips  = JSON.parse(sessionStorage.getItem("searchResults"));

  if (!params || !trips) {
    console.warn("No search data found in session.");
    return;
  }

  console.log("Loaded search params:", params);
  console.log("Loaded trips:", trips);

  // Keep master copy for filtering
  allTrips = trips;

  // Fill search-bar inputs
  var whereEl    = document.getElementById("inp-where");
  var checkinEl  = document.getElementById("inp-checkin");
  var checkoutEl = document.getElementById("inp-checkout");
  var adultsEl   = document.getElementById("count-adults");
  var childrenEl = document.getElementById("count-children");
  var roomsEl    = document.getElementById("count-rooms");

  var resultstitle = document.getElementsByClassName("results-title");
  if (resultstitle.length) {
    resultstitle[0].textContent = "Experiences in " + params.location;
  }

  if (whereEl)    whereEl.value          = params.location;
  if (checkinEl)  checkinEl.value        = params.startdate;
  if (checkoutEl) checkoutEl.value       = params.enddate;
  if (adultsEl)   adultsEl.textContent   = params.numadults;
  if (childrenEl) childrenEl.textContent = params.numchild;
  if (roomsEl)    roomsEl.textContent    = params.rooms;

  // Initialise slider fill
  updateSliderFill();

  // Render with default filters (show all)
  applyFilters();
});

// ── Price slider helpers ───────────────────────────────────────

/**
 * Called by oninput on both range inputs.
 * Keeps min <= max, updates labels and fill bar, then re-filters.
 */
function onRangeInput() {
  var minEl = document.getElementById("range-min");
  var maxEl = document.getElementById("range-max");
  if (!minEl || !maxEl) return;

  var minVal = parseInt(minEl.value);
  var maxVal = parseInt(maxEl.value);

  // Prevent thumbs from crossing
  if (minVal > maxVal) {
    // Figure out which thumb moved and clamp
    if (this === minEl) {
      minEl.value = maxVal;
      minVal = maxVal;
    } else {
      maxEl.value = minVal;
      maxVal = minVal;
    }
  }

  // Update labels
  var minLabel = document.getElementById("price-min-label");
  var maxLabel = document.getElementById("price-max-label");
  if (minLabel) minLabel.textContent = "€" + minVal.toLocaleString();
  if (maxLabel) maxLabel.textContent = maxVal >= 20000 ? "€20,000+" : "€" + maxVal.toLocaleString();

  currentFilters.priceMin = minVal;
  currentFilters.priceMax = maxVal;

  updateSliderFill();
  applyFilters();
}

/** Visually fill the track between the two thumbs */
function updateSliderFill() {
  var minEl  = document.getElementById("range-min");
  var maxEl  = document.getElementById("range-max");
  var fillEl = document.getElementById("slider-fill");
  if (!minEl || !maxEl || !fillEl) return;

  var min    = parseInt(minEl.min)   || 0;
  var max    = parseInt(minEl.max)   || 20000;
  var minVal = parseInt(minEl.value) || 0;
  var maxVal = parseInt(maxEl.value) || 20000;

  var leftPct  = ((minVal - min) / (max - min)) * 100;
  var rightPct = ((maxVal - min) / (max - min)) * 100;

  fillEl.style.left  = leftPct  + "%";
  fillEl.style.width = (rightPct - leftPct) + "%";
}

// ── Hotel rating toggle ────────────────────────────────────────

function toggleRating(el) {
  el.classList.toggle("selected");

  // Rebuild selected-ratings array from all currently selected tiles
  var selected = document.querySelectorAll(".rating-option.selected");
  currentFilters.ratings = Array.from(selected).map(function (tile) {
    return parseInt(tile.dataset.rating); // "5" → 5, "4" → 4
  });

  applyFilters();
}

// ── Core filter + sort + render ────────────────────────────────

function applyFilters() {
  var filtered = allTrips.filter(function (item) {
    // ── Price filter ──────────────────────────────────────────
    var price = parsePrice(item.price);
    if (price < currentFilters.priceMin) return false;
    if (currentFilters.priceMax < 20000 && price > currentFilters.priceMax) return false;

    // ── Hotel rating filter ───────────────────────────────────
    // If no ratings are selected, show everything
    if (currentFilters.ratings.length > 0) {
      var hotelRating = item.hotel ? parseInt(item.hotel.rating) : 0;
      if (!currentFilters.ratings.includes(hotelRating)) return false;
    }

    return true;
  });

  // ── Sort ──────────────────────────────────────────────────────
  var sortSelect = document.getElementById("sort-select");
  var sortVal    = sortSelect ? sortSelect.value : "recommended";

  if (sortVal === "price-asc") {
    filtered.sort(function (a, b) { return parsePrice(a.price) - parsePrice(b.price); });
  } else if (sortVal === "price-desc") {
    filtered.sort(function (a, b) { return parsePrice(b.price) - parsePrice(a.price); });
  } else if (sortVal === "rating") {
    filtered.sort(function (a, b) {
      return ((b.hotel && b.hotel.rating) || 0) - ((a.hotel && a.hotel.rating) || 0);
    });
  }
  // "recommended" and "duration" keep original order (or add duration logic as needed)

  // Update count
  var countEl = document.getElementById("results-count");
  if (countEl) countEl.textContent = filtered.length;

  renderTrips(filtered);
  renderActiveTags();
}

/**
 * Extracts a numeric value from price strings like "€4,200", "$3500", "4200".
 */
function parsePrice(priceStr) {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  return parseFloat(String(priceStr).replace(/[^0-9.]/g, "")) || 0;
}

// ── Active filter tags ─────────────────────────────────────────

function renderActiveTags() {
  var container = document.getElementById("active-filters");
  if (!container) return;

  var tags = [];

  // Price tag (only if not at defaults)
  if (currentFilters.priceMin > 0 || currentFilters.priceMax < 20000) {
    var maxLabel = currentFilters.priceMax >= 20000 ? "€20,000+" : "€" + currentFilters.priceMax.toLocaleString();
    tags.push({
      label: "€" + currentFilters.priceMin.toLocaleString() + " – " + maxLabel,
      clear: "clearPriceFilter"
    });
  }

  // Rating tags
  currentFilters.ratings.forEach(function (r) {
    tags.push({
      label: r + "★",
      clear: "clearRatingFilter(" + r + ")"
    });
  });

  if (tags.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = tags.map(function (t) {
    return '<span class="filter-tag">' + t.label +
      ' <button onclick="' + t.clear + '">✕</button></span>';
  }).join("");
}

function clearPriceFilter() {
  currentFilters.priceMin = 0;
  currentFilters.priceMax = 20000;
  var minEl = document.getElementById("range-min");
  var maxEl = document.getElementById("range-max");
  if (minEl) minEl.value = 0;
  if (maxEl) maxEl.value = 20000;
  var minLabel = document.getElementById("price-min-label");
  var maxLabel = document.getElementById("price-max-label");
  if (minLabel) minLabel.textContent = "€0";
  if (maxLabel) maxLabel.textContent = "€20,000+";
  updateSliderFill();
  applyFilters();
}

function clearRatingFilter(rating) {
  currentFilters.ratings = currentFilters.ratings.filter(function (r) { return r !== rating; });
  // Deselect the matching tile
  var tiles = document.querySelectorAll('.rating-option[data-rating="' + rating + '"]');
  tiles.forEach(function (t) { t.classList.remove("selected"); });
  applyFilters();
}

function clearFilters() {
  clearPriceFilter();
  currentFilters.ratings = [];
  document.querySelectorAll(".rating-option.selected").forEach(function (el) {
    el.classList.remove("selected");
  });
  applyFilters();
}

// ── Render cards ───────────────────────────────────────────────

function renderTrips(data) {
  var container = document.getElementById("cards-container");
  var noResults = document.getElementById("no-results");
  if (!container || !noResults) return;

  if (!data || data.length === 0) {
    container.innerHTML = "";
    noResults.classList.add("show");
    return;
  }
  noResults.classList.remove("show");

  var params   = JSON.parse(sessionStorage.getItem("searchParams")) || {};
  var adults   = params.numadults  || 1;
  var children = params.numchild   || 0;

  var travStr = adults + (adults === 1 ? " adult" : " adults");
  if (children > 0) {
    travStr += " & " + children + (children === 1 ? " child" : " children");
  }

  function parseDates(dateRange) {
    if (!dateRange) return { checkin: "–", checkout: "–" };
    var clean = dateRange.replace(/[\[\]\(\)]/g, "");
    var parts = clean.split(",");
    return { checkin: parts[0] || "–", checkout: parts[1] || "–" };
  }

  function getStars(rating) {
    var stars = "";
    for (var i = 0; i < 5; i++) {
      stars += i < rating ? "★" : "☆";
    }
    return stars;
  }

  container.innerHTML = data.map(function (item, i) {
    var dates = parseDates(item.date);
    var img   = (item.media && item.media.length > 0) ? item.media[0] : "placeholder.jpg";
    var hotel = item.hotel || {};

    return ''
      + '<div class="experience-card" style="animation-delay:' + (i * 0.06) + 's">'
        + '<div class="card-img-wrap">'
          + '<img class="card-img" src="' + img + '" alt="' + item.name + '" loading="lazy">'
          + (item.visual ? '<div class="signature-badge">✦ Signature Collection</div>' : '')
          + '<button class="wishlist-btn" onclick="toggleWishlist(this)" title="Save">♡</button>'
        + '</div>'
        + '<div class="card-body">'
          + '<div class="card-top">'
            + '<div class="card-title">' + item.name + '</div>'
            + '<div class="info-box">'
              + '<div class="info-segment"><div class="info-seg-label">Country</div><div class="info-seg-value">' + item.country + '</div></div>'
              + '<div class="info-segment"><div class="info-seg-label">Hotel</div><div class="info-seg-value blue">' + (hotel.name || "N/A") + '</div><div class="rating-stars">' + getStars(hotel.rating || 0) + '</div></div>'
              + '<div class="info-segment"><div class="info-seg-label">Price</div><div class="info-seg-value blue">' + item.price + '</div><div style="font-size:10px;color:var(--muted)">' + travStr + '</div></div>'
            + '</div>'
          + '</div>'
          + '<div class="card-meta">'
            + '<div class="meta-item">📅 ' + dates.checkin + ' → ' + dates.checkout + '</div>'
            + '<div class="meta-item">👥 ' + item.adults + ' adults · ' + item.children + ' children · ' + item.room + ' room(s)</div>'
            + '<div class="meta-item">📍 ' + item.places + ' places to visit</div>'
          + '</div>'
          + '<div class="card-body">'
            + '<p style="font-size:13px;color:var(--muted)">' + item.description + '</p>'
          + '</div>'
          + '<div class="card-footer">'
            + '<div class="price-wrap">'
              + '<div class="price-main">' + item.price + '</div>'
              + '<div class="price-sub">for ' + travStr + '</div>'
            + '</div>'
            + '<button class="view-btn" onclick="viewDetails(' + item.id + ')">View Details →</button>'
          + '</div>'
        + '</div>'
      + '</div>';
  }).join("");
}

// ── Update search (re-query API) ───────────────────────────────

async function updateSearch() {
  sessionStorage.removeItem("searchParams");
  sessionStorage.removeItem("searchResults");

  var locationInput  = document.getElementById("inp-where").value.trim();
  var startDateInput = document.getElementById("inp-checkin").value;
  var endDateInput   = document.getElementById("inp-checkout").value;
  var adultsInput    = document.getElementById("count-adults").textContent.trim();
  var childrenInput  = document.getElementById("count-children").textContent.trim();
  var roomInput      = document.getElementById("count-rooms").textContent.trim();

  var params = {
    location:   locationInput,
    startdate:  startDateInput  || null,
    enddate:    endDateInput    || null,
    numadults:  parseInt(adultsInput),
    numchild:   parseInt(childrenInput),
    rooms:      parseInt(roomInput)
  };

  var trips = await searchTripsAPI(params);
  allTrips  = trips;

  sessionStorage.setItem("searchParams",  JSON.stringify(params));
  sessionStorage.setItem("searchResults", JSON.stringify(trips));

  // Update header title
  var resultstitle = document.getElementsByClassName("results-title");
  if (resultstitle.length) {
    resultstitle[0].textContent = "Experiences in " + params.location;
  }

  applyFilters();
}

// ── Travellers dropdown ────────────────────────────────────────

function toggleTravellersDropdown() {
  var dropdown = document.getElementById("travellers-dropdown");
  if (dropdown) dropdown.classList.toggle("open");
}

function changeCount(type, delta) {
  var countEl = document.getElementById("count-" + type);
  if (!countEl) return;
  var newCount = Math.max(0, parseInt(countEl.textContent) + delta);
  countEl.textContent = newCount;
}


function viewDetails(tripId) {
  var trip = allTrips.find(function (t) {
    return String(t.id) === String(tripId);
  });

  if (!trip) {
    console.warn("Trip not found:", tripId);
    return;
  }

  sessionStorage.setItem("selectedTrip", JSON.stringify(trip));
  window.location.href = "details.html";
}
