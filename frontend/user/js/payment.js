/* ============================================================
   MakeMYtrip — Payment / Checkout JavaScript
   js/payment.js
   Depends on: api.js (loaded before this script)
   ============================================================ */


/* ── 1. NAME FIELD: LETTERS & SPACES ONLY ── */
function blockDigitsInName(e) {
  var controlKeys = ["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Home","End"];
  if (controlKeys.indexOf(e.key) !== -1) return;
  if (/\d/.test(e.key))                  { e.preventDefault(); return; }
  if (!/^[a-zA-ZÀ-ÿ\s'\-]$/.test(e.key)) e.preventDefault();
}


/* ── 2. CARD NUMBER: DIGITS + AUTO-SPACE EVERY 4 DIGITS ── */
function formatCard(input) {
  var digits  = input.value.replace(/\D/g, "").slice(0, 16);
  var grouped = digits.match(/.{1,4}/g);
  input.value = grouped ? grouped.join(" ") : "";

  if (digits.length === 16) clearError("inp-card", "err-card");
  else document.getElementById("inp-card").classList.remove("valid");
}


/* ── 3. EXPIRY DATE: REAL-TIME BLOCKING ── */
function formatExpiry(input) {
  var digits = input.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) { input.value = ""; return; }

  var d0 = parseInt(digits[0], 10);
  if (digits.length === 1 && d0 >= 2) digits = "0" + digits;

  if (digits.length >= 2) {
    var mm = parseInt(digits.slice(0, 2), 10);
    if (mm > 12) digits = "12" + digits.slice(2);
    if (mm < 1)  digits = "01" + digits.slice(2);
  }

  if (digits.length >= 3) {
    var yyRaw = digits.slice(2);
    if (yyRaw.length === 2) {
      var yy = parseInt(yyRaw, 10);
      if (yy < 20) yyRaw = "20";
      if (yy > 60) yyRaw = "60";
      digits = digits.slice(0, 2) + yyRaw;
    }
  }

  input.value = digits.length >= 3 ? digits.slice(0, 2) + " / " + digits.slice(2) : digits;

  var parts = input.value.split(" / ");
  var mm2   = parseInt(parts[0], 10);
  var yy2   = parseInt(parts[1], 10);
  if (parts.length === 2 && mm2 >= 1 && mm2 <= 12 && yy2 >= 20 && yy2 <= 60) {
    clearError("inp-expiry", "err-expiry");
  } else {
    document.getElementById("inp-expiry").classList.remove("valid");
  }
}


/* ── 4. CVV: DIGITS ONLY, MAX 3 ── */
function formatCvv(input) {
  input.value = input.value.replace(/\D/g, "").slice(0, 3);
  if (input.value.length === 3) clearError("inp-cvv", "err-cvv");
  else document.getElementById("inp-cvv").classList.remove("valid");
}


/* ── 5. ERROR HELPERS ── */
function showError(inputId, errorId, message) {
  var inp = document.getElementById(inputId);
  var err = document.getElementById(errorId);
  if (!inp || !err) return;
  inp.classList.add("invalid");
  inp.classList.remove("valid");
  err.textContent = message;
}

function clearError(inputId, errorId) {
  var inp = document.getElementById(inputId);
  var err = document.getElementById(errorId);
  if (!inp || !err) return;
  inp.classList.remove("invalid");
  inp.classList.add("valid");
  err.textContent = "";
}


/* ── 6. FINAL VALIDATION ON SUBMIT ── */
function validateAndPay() {
  var ok = true;

  var nameVal = document.getElementById("inp-name").value.trim();
  if (nameVal.length < 2) {
    showError("inp-name", "err-name", "Please enter the cardholder's full name.");
    ok = false;
  } else { clearError("inp-name", "err-name"); }

  var cardRaw = document.getElementById("inp-card").value.replace(/\s/g, "");
  if (cardRaw.length !== 16 || /\D/.test(cardRaw)) {
    showError("inp-card", "err-card", "Card number must be exactly 16 digits.");
    ok = false;
  } else { clearError("inp-card", "err-card"); }

  var expiryVal = document.getElementById("inp-expiry").value;
  var parts = expiryVal.split(" / ");
  var mm = parseInt(parts[0], 10);
  var yy = parseInt(parts[1], 10);
  var expiryOk = parts.length === 2 && !isNaN(mm) && mm >= 1 && mm <= 12 && !isNaN(yy) && yy >= 20 && yy <= 60;
  if (!expiryOk) {
    showError("inp-expiry", "err-expiry", "Month: 01–12 · Year: 20–60.");
    ok = false;
  } else { clearError("inp-expiry", "err-expiry"); }

  var cvvVal = document.getElementById("inp-cvv").value;
  if (cvvVal.length !== 3 || /\D/.test(cvvVal)) {
    showError("inp-cvv", "err-cvv", "CVV must be exactly 3 digits.");
    ok = false;
  } else { clearError("inp-cvv", "err-cvv"); }

  if (!ok) {
    showToast("Please fix the card details above", "error");
    return;
  }

  var params = getUrlParams();
  var totalDisplay = currentPaymentTotal || "€4,850.00";
  var txCode = params.transaction_code || "";

  showToast("Payment of " + totalDisplay + " processed successfully!", "success", 6000);

  if (txCode) {
    showToast("Transaction code: " + txCode + " — Save this for your records", "info", 10000);
  }

  /* Clear caches after successful payment */
  clearTripCache();
}

/* ── Payment context state ── */
var currentPaymentTotal = null;

/* ── 7. LOAD ORDER SUMMARY — from localStorage, API, or URL params ── */
async function loadPaymentContext() {
  var params = getUrlParams();

  /* Try localStorage cache first */
  var cached = loadTripCache();
  if (cached) {
    var price = parsePrice(cached.price) || parseFloat(params.price) || 0;
    var tripName = cached.name || cached.title || decodeURIComponent(params.name || "Trip");

    var nameEl = document.getElementById("pay-trip-name");
    if (nameEl) nameEl.textContent = tripName;

    var travellers = loadTravellerData();
    var metaEl = document.getElementById("pay-trip-meta");
    var days = cached.days || 8;
    var nights = cached.nights || 7;
    var travParts = [];
    travParts.push(travellers.adults + (travellers.adults === 1 ? " Adult" : " Adults"));
    if (travellers.children > 0) travParts.push(travellers.children + (travellers.children === 1 ? " Child" : " Children"));
    var travStr = travParts.join(" & ");

    if (metaEl) {
      metaEl.textContent = days + " Days · " + travStr;
    }

    var durEl = document.getElementById("pay-duration");
    if (durEl) durEl.textContent = days + " Days / " + nights + " Nights";

    var travEl = document.getElementById("pay-travellers");
    if (travEl) travEl.textContent = travStr;

    var lblFlights = document.getElementById("pay-label-flights");
    if (lblFlights) lblFlights.textContent = "Flights (" + travStr + ")";

    var lblHotel = document.getElementById("pay-label-hotel");
    if (lblHotel) lblHotel.textContent = "Hotel (" + nights + " Nights)";

    if (price > 0) {
      currentPaymentTotal = formatEUR(price);
      updatePriceDisplays(price);
    }
  }

  /* Try to load trip details from API if we have a trip_id */
  if (params.trip_id) {
    try {
      var trip = await fetchTripById(params.trip_id);

      if (trip) {
        var apiPrice = parsePrice(trip.price);
        var dates = parseDateRange(trip.date);
        var apiDays = daysBetween(dates.start, dates.end);
        var apiNights = Math.max(apiDays - 1, 0);

        var tripName2 = document.getElementById("pay-trip-name");
        if (tripName2) tripName2.textContent = trip.name || "Trip";

        var tripMeta2 = document.getElementById("pay-trip-meta");
        if (tripMeta2) tripMeta2.textContent = apiDays + " Days · " + apiNights + " Nights";

        currentPaymentTotal = formatEUR(apiPrice);
        updatePriceDisplays(apiPrice);
        showToast("Trip details loaded successfully", "success", 2000);
      }
      return;
    } catch (err) {
      console.warn("Could not load trip details from API:", err.message);
    }
  }

  /* Fallback: use URL params */
  if (params.price && !cached) {
    var price2 = parseFloat(params.price);
    currentPaymentTotal = formatEUR(price2);
    updatePriceDisplays(price2);
  }

  if (params.name && !cached) {
    var nameEl2 = document.getElementById("pay-trip-name");
    if (nameEl2) nameEl2.textContent = decodeURIComponent(params.name);
  }
}

/* ── Update all price displays ── */
function updatePriceDisplays(totalPrice) {
  var payBtnAmount = document.getElementById("pay-btn-amount");
  if (payBtnAmount) payBtnAmount.textContent = formatEUR(totalPrice);

  var payTotal = document.getElementById("pay-total");
  if (payTotal) payTotal.textContent = formatEUR(totalPrice);

  var hotelCost = Math.round(totalPrice * 0.70);
  var flightCost = Math.round(totalPrice * 0.20);
  var taxesCost = totalPrice - hotelCost - flightCost;

  var pFlights = document.getElementById("pay-price-flights");
  if (pFlights) pFlights.textContent = formatEUR(flightCost);

  var pHotel = document.getElementById("pay-price-hotel");
  if (pHotel) pHotel.textContent = formatEUR(hotelCost);

  var pTaxes = document.getElementById("pay-price-taxes");
  if (pTaxes) pTaxes.textContent = formatEUR(taxesCost);
}


/* ── 8. ATTACH EVENT LISTENERS ── */
document.addEventListener("DOMContentLoaded", function () {
  var nameInp   = document.getElementById("inp-name");
  var cardInp   = document.getElementById("inp-card");
  var expiryInp = document.getElementById("inp-expiry");
  var cvvInp    = document.getElementById("inp-cvv");

  if (nameInp)   nameInp.addEventListener("keydown", blockDigitsInName);
  if (cardInp)   cardInp.addEventListener("input",   function(){ formatCard(this); });
  if (expiryInp) expiryInp.addEventListener("input", function(){ formatExpiry(this); });
  if (cvvInp)    cvvInp.addEventListener("input",    function(){ formatCvv(this); });

  loadPaymentContext();
});
