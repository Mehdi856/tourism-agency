/* ============================================================
   MakeMYtrip — Homepage JavaScript
   js/index.js
   Depends on: api.js (loaded before this script)
   ============================================================ */

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

async function searchTrips() {
  var locationInput = document.getElementById("inp-where").value.trim();
  var startDateInput = document.getElementById("inp-checkin").value;
  var endDateInput = document.getElementById("inp-checkout").value;
  var adultsInput = document.getElementById("count-adults").textContent.trim();
  var childrenInput = document.getElementById("count-children").textContent.trim();
  var roomInput = document.getElementById("count-rooms").textContent.trim();

    var params = {
    location: locationInput,
    startdate: startDateInput,
    enddate: endDateInput,
    numadults: parseInt(adultsInput),
    numchild: parseInt(childrenInput),
    rooms: parseInt(roomInput)
  };

  var trips = await searchTripsAPI(params);

  sessionStorage.setItem("searchParams", JSON.stringify(params));
  sessionStorage.setItem("searchResults", JSON.stringify(trips));
  window.location.href = "search.html";
}

async function toggleTravellersDropdown() {
  var dropdown = document.getElementById("travellers-dropdown");
  if (dropdown) {
    dropdown.classList.toggle("open");
  }
}

function changeCount(type, delta) {
  var countEl = document.getElementById("count-" + type);
  if (!countEl) return;

  var currentCount = parseInt(countEl.textContent);
  var newCount = Math.max(0, currentCount + delta);
  countEl.textContent = newCount;
}


/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  loadVisualTrips();
});
