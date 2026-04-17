/* ============================================================
   MakeMYtrip — Payment / Checkout JavaScript
   js/payment.js
   ============================================================ */


/* ── 1. NAME FIELD: LETTERS & SPACES ONLY ───────────────────
   Fires on every keydown in the "Cardholder's Name" field.
   Blocks digits and most special characters before they appear.
   ────────────────────────────────────────────────────────── */
function blockDigitsInName(e) {
  var controlKeys = ["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Home","End"];
  if (controlKeys.indexOf(e.key) !== -1) return;
  if (/\d/.test(e.key))                  { e.preventDefault(); return; }
  if (!/^[a-zA-ZÀ-ÿ\s'\-]$/.test(e.key)) e.preventDefault();
}


/* ── 2. CARD NUMBER: DIGITS + AUTO-SPACE EVERY 4 DIGITS ─────
   1. Strip non-digits, limit to 16.
   2. Re-insert spaces: "1234 5678 9012 3456"
   ────────────────────────────────────────────────────────── */
function formatCard(input) {
  var digits  = input.value.replace(/\D/g, "").slice(0, 16);
  var grouped = digits.match(/.{1,4}/g);
  input.value = grouped ? grouped.join(" ") : "";

  if (digits.length === 16) clearError("inp-card", "err-card");
  else document.getElementById("inp-card").classList.remove("valid");
}


/* ── 3. EXPIRY DATE: REAL-TIME BLOCKING ─────────────────────
   - Auto-pads single-digit months > 1 (e.g. "3" → "03").
   - Clamps MM to 01–12, YY to 20–60.
   - Formats as "MM / YY".
   ────────────────────────────────────────────────────────── */
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


/* ── 4. CVV: DIGITS ONLY, MAX 3 ─────────────────────────── */
function formatCvv(input) {
  input.value = input.value.replace(/\D/g, "").slice(0, 3);
  if (input.value.length === 3) clearError("inp-cvv", "err-cvv");
  else document.getElementById("inp-cvv").classList.remove("valid");
}


/* ── 5. ERROR HELPERS ────────────────────────────────────── */
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


/* ── 6. FINAL VALIDATION ON SUBMIT ──────────────────────────
   Validates all four fields, shows errors, or proceeds.
   ────────────────────────────────────────────────────────── */
function validateAndPay() {
  var ok = true;

  /* ① Name */
  var nameVal = document.getElementById("inp-name").value.trim();
  if (nameVal.length < 2) {
    showError("inp-name", "err-name", "Please enter the cardholder's full name.");
    ok = false;
  } else {
    clearError("inp-name", "err-name");
  }

  /* ② Card number — 16 digits */
  var cardRaw = document.getElementById("inp-card").value.replace(/\s/g, "");
  if (cardRaw.length !== 16 || /\D/.test(cardRaw)) {
    showError("inp-card", "err-card", "Card number must be exactly 16 digits.");
    ok = false;
  } else {
    clearError("inp-card", "err-card");
  }

  /* ③ Expiry */
  var expiryVal = document.getElementById("inp-expiry").value;
  var parts = expiryVal.split(" / ");
  var mm = parseInt(parts[0], 10);
  var yy = parseInt(parts[1], 10);
  var expiryOk = parts.length === 2 && !isNaN(mm) && mm >= 1 && mm <= 12 && !isNaN(yy) && yy >= 20 && yy <= 60;
  if (!expiryOk) {
    showError("inp-expiry", "err-expiry", "Month: 01–12 · Year: 20–60.");
    ok = false;
  } else {
    clearError("inp-expiry", "err-expiry");
  }

  /* ④ CVV */
  var cvvVal = document.getElementById("inp-cvv").value;
  if (cvvVal.length !== 3 || /\D/.test(cvvVal)) {
    showError("inp-cvv", "err-cvv", "CVV must be exactly 3 digits.");
    ok = false;
  } else {
    clearError("inp-cvv", "err-cvv");
  }

  if (ok) {
    alert("✅ Payment of €4,850.00 submitted successfully!");
    /* In production: replace with real payment API call */
  }
}


/* ── 7. ATTACH EVENT LISTENERS ───────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  var nameInp   = document.getElementById("inp-name");
  var cardInp   = document.getElementById("inp-card");
  var expiryInp = document.getElementById("inp-expiry");
  var cvvInp    = document.getElementById("inp-cvv");

  if (nameInp)   nameInp.addEventListener("keydown", blockDigitsInName);
  if (cardInp)   cardInp.addEventListener("input",   function(){ formatCard(this); });
  if (expiryInp) expiryInp.addEventListener("input", function(){ formatExpiry(this); });
  if (cvvInp)    cvvInp.addEventListener("input",    function(){ formatCvv(this); });
});
