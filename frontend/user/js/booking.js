/* ============================================================
   MakeMYtrip — Personal Information / Booking JavaScript
   js/booking.js
   ============================================================ */

/* ── Letters-only validation ── */
function lettersOnly(input) {
  input.value = input.value.replace(/[^a-zA-ZÀ-ÿ\s\-]/g, "");
}

/* ── Room / People state ── */
var selectedRooms  = 1;
var selectedPeople = 3;

/* ── Match left panel height to right panel ── */
function matchPanelHeight() {
  var right = document.querySelector(".right-panel");
  var left  = document.getElementById("leftPanel");
  if (right && left) left.style.height = right.offsetHeight + "px";
}

/* ── Select rooms ── */
function selectRooms(el) {
  var val = parseInt(el.dataset.val) || 4;
  if (val > selectedPeople) {
    var warn = document.getElementById("roomsWarning");
    if (warn) warn.style.display = "block";
    return;
  }
  var warn = document.getElementById("roomsWarning");
  if (warn) warn.style.display = "none";
  selectedRooms = val;
  document.querySelectorAll("#roomsGroup .chip").forEach(function(c){ c.classList.remove("active"); });
  el.classList.add("active");
}

/* ── Select people ── */
function selectPeople(el) {
  var val = parseInt(el.dataset.val) || 5;
  selectedPeople = val;
  document.querySelectorAll("#peopleGroup .chip").forEach(function(c){ c.classList.remove("active"); });
  el.classList.add("active");

  if (selectedRooms > selectedPeople) {
    selectedRooms = selectedPeople;
    document.querySelectorAll("#roomsGroup .chip").forEach(function(c) {
      c.classList.remove("active");
      if ((parseInt(c.dataset.val) || 4) === selectedRooms) c.classList.add("active");
    });
  }

  var warn = document.getElementById("roomsWarning");
  if (warn) warn.style.display = "none";

  enforceRoomsConstraint();
  renderExtraTravelers();
  setTimeout(matchPanelHeight, 50);
}

/* ── Disable room chips above people count ── */
function enforceRoomsConstraint() {
  document.querySelectorAll("#roomsGroup .chip").forEach(function(c) {
    var cv = parseInt(c.dataset.val) || 4;
    if (cv > selectedPeople) c.classList.add("disabled");
    else c.classList.remove("disabled");
  });
}

/* ── Render extra traveler input cards ── */
function renderExtraTravelers() {
  var container = document.getElementById("extraTravelers");
  if (!container) return;
  container.innerHTML = "";
  var extras = selectedPeople - 1;
  if (extras <= 0) return;
  for (var i = 1; i <= extras; i++) {
    var card = document.createElement("div");
    card.className = "traveler-card";
    card.innerHTML =
      '<h4>Traveler ' + (i + 1) + '</h4>'
      + '<div class="form-row full-three">'
        + '<div class="form-group"><label>First Name</label><input type="text" placeholder="First name" oninput="lettersOnly(this)"/></div>'
        + '<div class="form-group"><label>Last Name</label><input type="text" placeholder="Last name" oninput="lettersOnly(this)"/></div>'
        + '<div class="form-group"><label>Age</label><input type="number" placeholder="Age" min="1" max="120"/></div>'
      + '</div>';
    container.appendChild(card);
  }
}

/* ── "Book Now" — navigate to payment ── */
function handleBookNow() {
  var firstName = document.getElementById("firstName");
  var lastName  = document.getElementById("lastName");
  var email     = document.getElementById("email");

  var valid = true;

  [firstName, lastName, email].forEach(function(inp) {
    if (!inp) return;
    if (!inp.value.trim()) {
      inp.classList.add("input-error");
      valid = false;
    } else {
      inp.classList.remove("input-error");
    }
  });

  if (!valid) {
    alert("Please fill in all required fields before continuing.");
    return;
  }

  window.location.href = "payment.html";
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  enforceRoomsConstraint();
  renderExtraTravelers();
  setTimeout(matchPanelHeight, 300);

  var ro = new ResizeObserver(matchPanelHeight);
  var rightPanel = document.querySelector(".right-panel");
  if (rightPanel) ro.observe(rightPanel);

  var bookBtn = document.querySelector(".book-btn");
  if (bookBtn) {
    bookBtn.addEventListener("click", handleBookNow);
  }
});
