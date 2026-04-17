/* ============================================================
   MakeMYtrip — Trip Details JavaScript
   js/details.js
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  /* "Confirm Selection" navigates to personal info / booking page */
  var confirmBtn = document.querySelector(".btn-confirm");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      window.location.href = "booking.html";
    });
  }
});
