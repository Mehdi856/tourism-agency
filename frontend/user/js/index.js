/* ============================================================
   MakeMYtrip — Homepage JavaScript
   js/index.js
   Depends on: api.js (loaded before this script)
   ============================================================ */

var counts = loadTravellerData();

/* ── Update the travellers input display ── */
function updateTravellersInput() {
  var parts = [];
  if (counts.adults > 0)   parts.push(counts.adults   + (counts.adults   === 1 ? " Adult"    : " Adults"));
  if (counts.children > 0) parts.push(counts.children + (counts.children === 1 ? " Child"    : " Children"));
  parts.push(counts.rooms  + (counts.rooms  === 1 ? " Room"    : " Rooms"));
  var el = document.getElementById("inp-travellers");
  if (el) el.value = parts.join(", ");

  /* Persist to localStorage */
  saveTravellerData(counts);
}

/* ── Increment / decrement a traveller counter ── */
function changeCount(type, delta) {
  var min = (type === "adults" || type === "rooms") ? 1 : 0;
  counts[type] = Math.max(min, counts[type] + delta);

  /* Room constraint: min rooms = ceil(adults/2), can't have 5 adults in 1 room */
  if (type === "adults" || type === "rooms") {
    var minR = minRoomsForAdults(counts.adults);
    if (counts.rooms < minR) counts.rooms = minR;

    /* Update rooms display */
    var roomsEl = document.getElementById("count-rooms");
    if (roomsEl) roomsEl.textContent = counts.rooms;
  }

  var el = document.getElementById("count-" + type);
  if (el) el.textContent = counts[type];
  updateTravellersInput();
}

/* ── Toggle travellers dropdown ── */
function toggleTravellersDropdown() {
  var d = document.getElementById("travellers-dropdown");
  if (!d) return;
  d.classList.toggle("open");
}

/* ── Close dropdown when clicking outside ── */
document.addEventListener("click", function (e) {
  var field = document.querySelector(".travellers-field");
  var d = document.getElementById("travellers-dropdown");
  if (field && d && !field.contains(e.target)) {
    d.classList.remove("open");
  }
});

/* ── Search button: navigate to search page with params ── */
function handleSearch() {
  var where     = document.getElementById("inp-where")    ? document.getElementById("inp-where").value    : "";
  var checkin   = document.getElementById("inp-checkin")  ? document.getElementById("inp-checkin").value  : "";
  var checkout  = document.getElementById("inp-checkout") ? document.getElementById("inp-checkout").value : "";

  if (!where.trim()) {
    var inp = document.getElementById("inp-where");
    if (inp) { inp.style.border = "1px solid #ef4444"; setTimeout(function(){ inp.style.border=""; }, 1500); }
    showToast("Please enter a destination", "warning");
    return;
  }

  /* Save traveller data to localStorage */
  saveTravellerData(counts);

  window.location.href = "search.html?where=" + encodeURIComponent(where)
                         + "&checkin="  + encodeURIComponent(checkin)
                         + "&checkout=" + encodeURIComponent(checkout)
                         + "&adults="   + counts.adults
                         + "&children=" + counts.children
                         + "&rooms="    + counts.rooms;
}

/* ── Build a deal card HTML from API trip data ── */
function buildDealCard(trip) {
  var price = parsePrice(trip.price);
  var dates = parseDateRange(trip.date);
  var days = daysBetween(dates.start, dates.end);
  var nights = Math.max(days - 1, 0);
  var image = (trip.media && trip.media.length > 0) ? trip.media[0] : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80";
  var hotelName = (trip.hotel && trip.hotel.name) ? trip.hotel.name : "";
  var hotelStars = (trip.hotel && trip.hotel.stars) ? trip.hotel.stars : 0;

  var badges = '';
  if (hotelName) badges += '<span class="badge">' + hotelName + '</span>';
  if (hotelStars >= 5) badges += '<span class="badge green">' + hotelStars + '★</span>';

  return '<div class="deal-card" data-trip-id="' + trip.id + '">'
    + '<img class="deal-img" src="' + image + '" alt="' + (trip.name || 'Trip') + '">'
    + '<div class="deal-body">'
      + '<div class="deal-badges">' + badges + '</div>'
      + '<div class="deal-title">' + (trip.name || 'Unnamed Trip') + '</div>'
      + '<div class="deal-meta"><span>&#128197; ' + days + ' days, ' + nights + ' nights</span></div>'
      + '<div class="deal-footer">'
        + '<div class="deal-price">' + formatEUR(price) + '<span>/pp</span></div>'
        + '<button class="btn-book" onclick="goToDetails(' + trip.id + ')">Book Now</button>'
      + '</div>'
    + '</div>'
  + '</div>';
}

/* ── Navigate to details page ── */
function goToDetails(tripId) {
  window.location.href = "details.html?id=" + tripId;
}

/* ── "Book Now" card buttons (for static cards) ── */
function bookNow(destination) {
  window.location.href = "details.html?dest=" + encodeURIComponent(destination);
}

/* ── Load visual trips from API into the deals section ── */
async function loadVisualTrips() {
  var container = document.querySelector(".destinations-grid");

  if (!container) {
    console.error("Container not found");
    return;
  }

  container.innerHTML = skeletonCardHTML(4);

  try {
    var trips = await fetchVisualTrips();

    if (trips && trips.length > 0) {
      container.innerHTML = "";

      trips.forEach(function(trip) {
        const destcard = document.createElement("div");
        destcard.className = "dest-card";

        const image = document.createElement("img");
        image.src = trip.media[0];
        destcard.appendChild(image);

        const destlable = document.createElement("div");
        destlable.className = "dest-label";

        const title = document.createElement("h3");
        title.textContent = trip.country + "/" + trip.name;
        destlable.appendChild(title);

        const description = document.createElement("p");
        description.textContent = trip.description;
        destlable.appendChild(description);

        destcard.appendChild(destlable);

        destcard.addEventListener("click", function() {
          goToDetails(trip.id);
        });

        container.appendChild(destcard);
      });

      showToast("Trips loaded successfully", "success", 2000);
    } else {
      container.innerHTML = '';
      showToast("No trips available from server", "info");
    }
  } catch (err) {
    container.innerHTML = '';
    showToast("Using offline data — backend is not connected", "warning", 5000);
    console.warn("Could not load trips from API:", err.message);
  }
}

/* ── Autocomplete logic ── */
function initAutocomplete() {
  var inp = document.getElementById("inp-where");
  var list = document.getElementById("autocomplete-where");
  if (!inp || !list) return;

  var destinations = [
    "Rome", "Amalfi Coast", "Cinque Terre", "Venice",
    "Tuscany", "Alps", "Sicily", "Milan", "Florence"
  ];

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

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  initAutocomplete();

  /* Restore traveller counts from localStorage */
  var el;
  el = document.getElementById("count-adults"); if (el) el.textContent = counts.adults;
  el = document.getElementById("count-children"); if (el) el.textContent = counts.children;
  el = document.getElementById("count-rooms"); if (el) el.textContent = counts.rooms;

  updateTravellersInput();

  /* Wire search button */
  var searchBtn = document.querySelector(".search-btn");
  if (searchBtn) searchBtn.addEventListener("click", handleSearch);

  /* Wire static "Book Now" buttons (will be replaced if API loads) */
  document.querySelectorAll(".btn-book").forEach(function (btn) {
    btn.addEventListener("click", function () {
      bookNow(btn.closest(".deal-card, .trip-card")
               ? (btn.closest(".deal-card, .trip-card").querySelector(".deal-title, .trip-title") || {}).textContent || "Trip"
               : "Trip");
    });
  });

  /* Load dynamic deals from API */
  loadVisualTrips();
});
