/* ============================================================
   MakeMYtrip — Homepage JavaScript
   js/index.js
   ============================================================ */

var counts = { adults: 1, children: 0, rooms: 1 };

/* ── Update the travellers input display ── */
function updateTravellersInput() {
  var parts = [];
  if (counts.adults > 0)   parts.push(counts.adults   + (counts.adults   === 1 ? " Adult"    : " Adults"));
  if (counts.children > 0) parts.push(counts.children + (counts.children === 1 ? " Child"    : " Children"));
  parts.push(counts.rooms  + (counts.rooms  === 1 ? " Room"    : " Rooms"));
  var el = document.getElementById("inp-travellers");
  if (el) el.value = parts.join(", ");
}

/* ── Increment / decrement a traveller counter ── */
function changeCount(type, delta) {
  var min = (type === "adults" || type === "rooms") ? 1 : 0;
  counts[type] = Math.max(min, counts[type] + delta);
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

/* ── Search button: navigate to search page ── */
function handleSearch() {
  var where     = document.getElementById("inp-where")    ? document.getElementById("inp-where").value    : "";
  var checkin   = document.getElementById("inp-checkin")  ? document.getElementById("inp-checkin").value  : "";
  var checkout  = document.getElementById("inp-checkout") ? document.getElementById("inp-checkout").value : "";

  if (!where.trim()) {
    var inp = document.getElementById("inp-where");
    if (inp) { inp.style.border = "1px solid #ef4444"; setTimeout(function(){ inp.style.border=""; }, 1500); }
    return;
  }
  window.location.href = "search.html?where=" + encodeURIComponent(where)
                         + "&checkin="  + encodeURIComponent(checkin)
                         + "&checkout=" + encodeURIComponent(checkout);
}

/* ── "Book Now" card buttons ── */
function bookNow(destination) {
  window.location.href = "details.html?dest=" + encodeURIComponent(destination);
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  updateTravellersInput();

  /* Wire search button */
  var searchBtn = document.querySelector(".search-btn");
  if (searchBtn) searchBtn.addEventListener("click", handleSearch);

  /* Wire "Book Now" buttons */
  document.querySelectorAll(".btn-book").forEach(function (btn) {
    btn.addEventListener("click", function () {
      bookNow(btn.closest(".deal-card, .trip-card")
               ? (btn.closest(".deal-card, .trip-card").querySelector(".deal-title, .trip-title") || {}).textContent || "Trip"
               : "Trip");
    });
  });
});
