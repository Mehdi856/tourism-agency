/* ============================================================
   MakeMYtrip — Personal Information / Booking JavaScript
   js/booking.js
   Depends on: api.js (loaded before this script)
   ============================================================ */

/* ── Letters-only validation ── */
function lettersOnly(input) {
  input.value = input.value.replace(/[^a-zA-ZÀ-ÿ\s\-]/g, "");
}

/* ── Trip & traveller state ── */
var currentTripId    = null;
var currentPrice     = null;
var currentTripName  = null;
var currentTripData  = null; // full trip object from sessionStorage

/*
 * FIX: loadTravellerData() is called at module level in the original code,
 * which runs before DOMContentLoaded — fine, but if api.js isn't fully
 * parsed yet this can throw. Wrap in a safe call and fall back to the
 * trip's own passenger counts pulled from sessionStorage.
 */
var currentTravellers = (function () {
  try {
    if (typeof loadTravellerData === "function") {
      var d = loadTravellerData();
      if (d && d.adults >= 0) return d;
    }
  } catch (e) { /* ignore */ }
  // Fallback: read from the stored trip object
  try {
    var t = JSON.parse(sessionStorage.getItem("selectedTrip") || "null");
    if (t) return { adults: t.adults || 1, children: t.children || 0, rooms: t.room || 1 };
  } catch (e) { /* ignore */ }
  return { adults: 1, children: 0, rooms: 1 };
}());

/* ── Load trip context from URL params + session/localStorage ── */
function loadTripContext() {
  /* FIX: getUrlParams may not exist in all api.js versions; use URLSearchParams */
  var params;
  if (typeof getUrlParams === "function") {
    params = getUrlParams();
  } else {
    params = {};
    new URLSearchParams(window.location.search).forEach(function (v, k) {
      params[k] = v;
    });
  }

  if (params.trip_id) currentTripId   = parseInt(params.trip_id, 10);
  if (params.price)   currentPrice    = parseFloat(params.price);
  if (params.name)    currentTripName = decodeURIComponent(params.name);

  /* Pull full trip object from sessionStorage (set by details.js) */
  try {
    currentTripData = JSON.parse(sessionStorage.getItem("selectedTrip") || "null");
  } catch (e) { currentTripData = null; }

  /* If URL params are missing, fill from the trip object */
  if (currentTripData) {
    if (!currentTripId   && currentTripData.id)    currentTripId   = currentTripData.id;
    if (!currentTripName && currentTripData.name)  currentTripName = currentTripData.name;
    if (!currentPrice    && currentTripData.price) currentPrice    = parsePrice(currentTripData.price);
  }

  /* Also try localStorage cache as last resort */
  if (!currentTripData) {
    try {
      var cached = (typeof loadTripCache === "function") ? loadTripCache() : null;
      if (cached) {
        if (!currentTripId   && cached.id)                       currentTripId   = cached.id;
        if (!currentPrice    && cached.price)                    currentPrice    = parsePrice(cached.price);
        if (!currentTripName && (cached.name || cached.title))   currentTripName = cached.name || cached.title;
        currentTripData = cached;
      }
    } catch (e) { /* ignore */ }
  }

  /* ── Update left panel ── */
  var tripNameEl = document.getElementById("booking-trip-name");
  if (tripNameEl) tripNameEl.textContent = currentTripName || "Your Trip";

  var tripDescEl = document.getElementById("booking-trip-desc");
  if (tripDescEl && currentTripName) {
    tripDescEl.innerHTML = "Your bespoke journey to <strong>" + currentTripName + "</strong> begins with a single detail.";
  }

  /*
   * FIX: Swap the left-panel background image to match the selected trip's
   * media. The original code never updated this image so it always showed
   * the hardcoded Alpine chalet photo.
   */
  var bgImg = document.getElementById("booking-bg-image");
  if (bgImg && currentTripData) {
    var tripImg = (currentTripData.media && currentTripData.media.length > 0)
      ? currentTripData.media[0]
      : (currentTripData.image || null);
    if (tripImg) {
      bgImg.src = tripImg;
      bgImg.alt = currentTripName || "Trip destination";
    }
  }

  /* ── Update price display ── */
  var priceEl = document.getElementById("booking-price");
  if (priceEl) {
    priceEl.textContent = currentPrice
      ? (typeof formatEUR === "function" ? formatEUR(currentPrice) : "\u20ac" + currentPrice.toLocaleString())
      : "\u20ac\u2014";
  }

  /* ── Set max date on DOB field to today ── */
  var dobEl = document.getElementById("dob");
  if (dobEl) dobEl.max = new Date().toISOString().slice(0, 10);
}

/* ── Show traveller summary ── */
function showTravellerSummary() {
  var summaryText = document.getElementById("traveller-summary-text");
  if (!summaryText) return;

  var t = currentTravellers;
  var parts = [];
  parts.push((t.adults || 1) + ((t.adults === 1) ? " Adult" : " Adults"));
  if (t.children > 0) parts.push(t.children + (t.children === 1 ? " Child" : " Children"));
  if (t.rooms > 0)    parts.push(t.rooms    + (t.rooms    === 1 ? " Room"  : " Rooms"));
  summaryText.textContent = parts.join("  \u2022  ");

  renderExtraTravelers();
}

/* ── Match left panel height to right panel ── */
function matchPanelHeight() {
  var right = document.querySelector(".right-panel");
  var left  = document.getElementById("leftPanel");
  if (right && left) left.style.height = right.offsetHeight + "px";
}

/* ── Render extra traveler input cards ── */
function renderExtraTravelers() {
  var container = document.getElementById("extraTravelers");
  if (!container) return;
  container.innerHTML = "";

  var totalPeople = (currentTravellers.adults || 1) + (currentTravellers.children || 0);
  var extras = totalPeople - 1;
  if (extras <= 0) return;

  for (var i = 1; i <= extras; i++) {
    /*
     * FIX: The original logic used `i >= currentTravellers.adults` to detect
     * children. With adults=2, children=1, extras=2 → i goes 1,2.
     * i=1 → Traveler 2 (adult, correct)
     * i=2 → i >= 2 is true → Child 1 (correct)
     * The logic was fine, but the age field used a free-text number input.
     * Switched to date-of-birth for consistency with the primary traveller
     * and with what the API actually needs.
     */
    var isChild = i >= (currentTravellers.adults || 1);
    var label   = isChild
      ? "Child " + (i - (currentTravellers.adults || 1) + 1)
      : "Traveler " + (i + 1);

    var card = document.createElement("div");
    card.className = "traveler-card";
    card.innerHTML =
      '<h4>' + label + '</h4>'
      + '<div class="form-row full-three">'
        + '<div class="form-group">'
          + '<label>First Name</label>'
          + '<input type="text" placeholder="First name" oninput="lettersOnly(this)"/>'
        + '</div>'
        + '<div class="form-group">'
          + '<label>Last Name</label>'
          + '<input type="text" placeholder="Last name" oninput="lettersOnly(this)"/>'
        + '</div>'
        + '<div class="form-group">'
          + '<label>Date of Birth</label>'
          + '<input type="date" max="' + new Date().toISOString().slice(0, 10) + '"/>'
        + '</div>'
      + '</div>';
    container.appendChild(card);
  }
}

/* ── Parse price string ── */
function parsePrice(priceStr) {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  return parseFloat(String(priceStr).replace(/[^0-9.]/g, "")) || 0;
}

/* ── VALIDATION HELPERS ── */
function validatePhone(value) {
  var digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

function validateDob(value) {
  if (!value) return true; // optional field
  var d = new Date(value);
  if (isNaN(d.getTime())) return false;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today; // must be in the past
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showFieldError(input, message) {
  if (!input) return;
  input.classList.add("input-error");
  var group = input.closest(".form-group");
  if (group) {
    var existing = group.querySelector(".field-error-msg");
    if (existing) existing.remove();
    var err = document.createElement("div");
    err.className = "field-error-msg";
    err.style.cssText = "font-size:11px;color:#ef4444;margin-top:3px;font-weight:500;";
    err.textContent = message;
    group.appendChild(err);
  }
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove("input-error");
  var group = input.closest(".form-group");
  if (group) {
    var existing = group.querySelector(".field-error-msg");
    if (existing) existing.remove();
  }
}

/* ── Show a toast notification ── */
function _showToast(message, type) {
  if (typeof showToast === "function") { showToast(message, type); return; }
  // Minimal inline fallback if api.js doesn't provide showToast
  var toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = [
    "position:fixed;bottom:24px;left:50%;transform:translateX(-50%)",
    "background:" + (type === "error" ? "#ef4444" : type === "success" ? "#22c55e" : "#f59e0b"),
    "color:#fff;padding:10px 20px;border-radius:8px;font-size:14px",
    "z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.2)"
  ].join(";");
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3000);
}

/* ── "Book Now" handler ── */
async function handleBookNow() {
  var firstName = document.getElementById("firstName");
  var lastName  = document.getElementById("lastName");
  var email     = document.getElementById("email");
  var phone     = document.getElementById("phone");
  var dob       = document.getElementById("dob"); // FIX: was "age"

  var valid = true;

  [firstName, lastName, email, phone, dob].forEach(function (inp) {
    if (inp) clearFieldError(inp);
  });

  if (!firstName || !firstName.value.trim()) {
    showFieldError(firstName, "First name is required");
    valid = false;
  }

  if (!lastName || !lastName.value.trim()) {
    showFieldError(lastName, "Last name is required");
    valid = false;
  }

  if (!email || !email.value.trim()) {
    showFieldError(email, "Email is required");
    valid = false;
  } else if (!validateEmail(email.value.trim())) {
    showFieldError(email, "Please enter a valid email address");
    valid = false;
  }

  if (phone && phone.value.trim()) {
    if (!validatePhone(phone.value.trim())) {
      showFieldError(phone, "Phone must be 8–15 digits (e.g. +213 555 000 000)");
      valid = false;
    }
  }

  /*
   * FIX: Was validating "age" as a number 1–120, but the API needs a
   * `birthdate` string. Now validates the date-of-birth field instead.
   */
  if (dob && dob.value) {
    if (!validateDob(dob.value)) {
      showFieldError(dob, "Please enter a valid date of birth");
      valid = false;
    }
  }

  if (!valid) {
    _showToast("Please fix the highlighted errors", "error");
    return;
  }

  var fullname  = (firstName.value.trim() + " " + lastName.value.trim()).trim();
  var birthdate = (dob && dob.value) ? dob.value : "2000-01-01";

  if (currentTripId) {
    try {
      var data = {
        fullname:  fullname,
        phonnum:   phone ? phone.value.trim() : "",
        email:     email.value.trim(),
        birthdate: birthdate, // FIX: now a real date from the DOB input
        trip_id:   currentTripId
      };

      var result = await registerAndReserve(data);

      _showToast("Booking confirmed! Redirecting to payment...", "success");

      setTimeout(function () {
        window.location.href = "payment.html"
          + "?transaction_code=" + encodeURIComponent(result.transaction_code)
          + "&trip_id="  + currentTripId
          + "&price="    + (currentPrice || 0)
          + "&name="     + encodeURIComponent(currentTripName || "Trip");
      }, 1000);
      return;

    } catch (err) {
      console.warn("Booking API failed:", err.message);
      _showToast("Booking API unavailable — proceeding to payment", "warning");
    }
  }

  /* Fallback: go to payment without API call */
  var payUrl    = "payment.html";
  var payParams = [];
  if (currentTripId)   payParams.push("trip_id=" + currentTripId);
  if (currentPrice)    payParams.push("price="   + currentPrice);
  if (currentTripName) payParams.push("name="    + encodeURIComponent(currentTripName));
  if (payParams.length) payUrl += "?" + payParams.join("&");

  window.location.href = payUrl;
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  loadTripContext();
  showTravellerSummary();
  setTimeout(matchPanelHeight, 300);

  var rightPanel = document.querySelector(".right-panel");
  if (rightPanel && typeof ResizeObserver !== "undefined") {
    new ResizeObserver(matchPanelHeight).observe(rightPanel);
  }

  var bookBtn = document.querySelector(".book-btn");
  if (bookBtn) bookBtn.addEventListener("click", handleBookNow);
});

function handleBookNow() {
  var fullname  = document.getElementById("firstName").value.trim() + " " + document.getElementById("lastName").value.trim();
  var email     = document.getElementById("email").value.trim();
  var phone     = document.getElementById("phone").value.trim();
  var birthdate = document.getElementById("dob").value; // FIX: was "age"
  var tripId    = currentTripId;

  // Basic validation (can be expanded)
  if (!fullname.trim() || !email) {
    alert("Please enter your full name and email.");
    return;
  }
var person = {
    "fullname": fullname,
    "phonnum": phone,
    "email": email,
    "birthdate": birthdate,
    "trip_id": tripId,
    "confirmation": false
}
  registerAndReserve(person)
    .then(function (result) {
      alert("Booking confirmed! Transaction code: " + result.transaction_code);
      // Redirect to payment page with necessary info
      window.location.href = "payment.html?transaction_code=" + encodeURIComponent(result.transaction_code) + "&trip_id=" + tripId;
    })
    .catch(function (err) {
      console.error("Booking failed:", err);
      alert("Booking failed: " + err.message);
    });
}