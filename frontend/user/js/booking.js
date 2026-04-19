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
var currentTripId  = null;
var currentPrice   = null;
var currentTripName = null;
var currentTravellers = loadTravellerData();

/* ── Load trip context from URL params + localStorage ── */
function loadTripContext() {
  var params = getUrlParams();

  if (params.trip_id) currentTripId = parseInt(params.trip_id);
  if (params.price)   currentPrice  = parseFloat(params.price);
  if (params.name)    currentTripName = decodeURIComponent(params.name);

  /* Try to pull from localStorage cache if URL is missing info */
  var cached = loadTripCache();
  if (cached) {
    if (!currentTripId && cached.id) currentTripId = cached.id;
    if (!currentPrice && cached.price) currentPrice = parsePrice(cached.price);
    if (!currentTripName && (cached.name || cached.title)) currentTripName = cached.name || cached.title;
  }

  /* Update left panel trip name */
  var tripNameEl = document.getElementById("booking-trip-name");
  if (tripNameEl && currentTripName) tripNameEl.textContent = currentTripName;

  /* Update left panel description */
  var tripDescEl = document.getElementById("booking-trip-desc");
  if (tripDescEl && currentTripName) {
    tripDescEl.innerHTML = "Your bespoke journey to <strong>" + currentTripName + "</strong> begins with a single detail.";
  }

  /* Update price display */
  var priceEl = document.getElementById("booking-price");
  if (priceEl && currentPrice) priceEl.textContent = formatEUR(currentPrice);
}

/* ── Show traveller summary (readonly — chosen on homepage) ── */
function showTravellerSummary() {
  var summaryText = document.getElementById("traveller-summary-text");
  if (!summaryText) return;

  var t = currentTravellers;
  var parts = [];
  parts.push(t.adults + (t.adults === 1 ? " Adult" : " Adults"));
  if (t.children > 0) parts.push(t.children + (t.children === 1 ? " Child" : " Children"));
  parts.push(t.rooms + (t.rooms === 1 ? " Room" : " Rooms"));
  summaryText.textContent = parts.join("  •  ");

  /* Render extra traveler cards based on actual count */
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
  var totalPeople = currentTravellers.adults + currentTravellers.children;
  var extras = totalPeople - 1;
  if (extras <= 0) return;
  for (var i = 1; i <= extras; i++) {
    var isChild = i >= currentTravellers.adults;
    var label = isChild ? "Child " + (i - currentTravellers.adults + 1) : "Traveler " + (i + 1);
    var card = document.createElement("div");
    card.className = "traveler-card";
    card.innerHTML =
      '<h4>' + label + '</h4>'
      + '<div class="form-row full-three">'
        + '<div class="form-group"><label>First Name</label><input type="text" placeholder="First name" oninput="lettersOnly(this)"/></div>'
        + '<div class="form-group"><label>Last Name</label><input type="text" placeholder="Last name" oninput="lettersOnly(this)"/></div>'
        + '<div class="form-group"><label>Age</label><input type="number" placeholder="Age" min="' + (isChild ? 0 : 18) + '" max="' + (isChild ? 17 : 120) + '"/></div>'
      + '</div>';
    container.appendChild(card);
  }
}

/* ── VALIDATION HELPERS ── */
function validatePhone(value) {
  /* Allow digits, spaces, +, -, parens. Minimum 8 digits */
  var digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

function validateAge(value) {
  var age = parseInt(value, 10);
  return !isNaN(age) && age >= 1 && age <= 120;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showFieldError(input, message) {
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
  input.classList.remove("input-error");
  var group = input.closest(".form-group");
  if (group) {
    var existing = group.querySelector(".field-error-msg");
    if (existing) existing.remove();
  }
}

/* ── "Book Now" — validate, call API, then go to payment ── */
async function handleBookNow() {
  var firstName = document.getElementById("firstName");
  var lastName  = document.getElementById("lastName");
  var email     = document.getElementById("email");
  var phone     = document.getElementById("phone");
  var age       = document.getElementById("age");

  var valid = true;

  /* Clear all previous errors */
  [firstName, lastName, email, phone, age].forEach(function(inp) {
    if (inp) clearFieldError(inp);
  });

  /* First name */
  if (!firstName || !firstName.value.trim()) {
    showFieldError(firstName, "First name is required");
    valid = false;
  }

  /* Last name */
  if (!lastName || !lastName.value.trim()) {
    showFieldError(lastName, "Last name is required");
    valid = false;
  }

  /* Email */
  if (!email || !email.value.trim()) {
    showFieldError(email, "Email is required");
    valid = false;
  } else if (!validateEmail(email.value.trim())) {
    showFieldError(email, "Please enter a valid email address");
    valid = false;
  }

  /* Phone number validation */
  if (phone && phone.value.trim()) {
    if (!validatePhone(phone.value.trim())) {
      showFieldError(phone, "Phone must be 8-15 digits (e.g. +33 612345678)");
      valid = false;
    }
  }

  /* Age validation */
  if (age && age.value.trim()) {
    if (!validateAge(age.value.trim())) {
      showFieldError(age, "Age must be between 1 and 120");
      valid = false;
    }
  }

  if (!valid) {
    showToast("Please fix the highlighted errors", "error");
    return;
  }

  /* Build full name */
  var fullname = (firstName.value.trim() + " " + lastName.value.trim()).trim();

  /* If we have a trip_id, try to call the API */
  if (currentTripId) {
    try {
      var data = {
        fullname:  fullname,
        phonnum:   phone ? phone.value.trim() : "",
        email:     email.value.trim(),
        birthdate: "2000-01-01",
        trip_id:   currentTripId
      };

      var result = await registerAndReserve(data);

      showToast("Booking confirmed! Redirecting to payment...", "success");

      setTimeout(function() {
        window.location.href = "payment.html?transaction_code=" + encodeURIComponent(result.transaction_code)
          + "&trip_id=" + currentTripId
          + "&price=" + (currentPrice || 0)
          + "&name=" + encodeURIComponent(currentTripName || "Trip");
      }, 1000);
      return;

    } catch (err) {
      console.warn("Booking API failed:", err.message);
      showToast("Booking API unavailable — proceeding to payment", "warning");
    }
  }

  /* Fallback: navigate to payment without API call */
  var payUrl = "payment.html";
  var payParams = [];
  if (currentTripId)   payParams.push("trip_id=" + currentTripId);
  if (currentPrice)    payParams.push("price=" + currentPrice);
  if (currentTripName) payParams.push("name=" + encodeURIComponent(currentTripName));
  if (payParams.length > 0) payUrl += "?" + payParams.join("&");

  window.location.href = payUrl;
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  loadTripContext();
  showTravellerSummary();
  setTimeout(matchPanelHeight, 300);

  var ro = new ResizeObserver(matchPanelHeight);
  var rightPanel = document.querySelector(".right-panel");
  if (rightPanel) ro.observe(rightPanel);

  var bookBtn = document.querySelector(".book-btn");
  if (bookBtn) {
    bookBtn.addEventListener("click", handleBookNow);
  }
});
