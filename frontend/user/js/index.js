/* ============================================================
   MakeMYtrip — Homepage JavaScript
   js/index.js
   Depends on: api.js (loaded before this script)
   ============================================================ */
var visualTrips = [];
var localTrips =[];
var lastTrips =[];
async function loadVisualTrips() {
  var container = document.querySelector(".destinations-grid");

  if (!container) {
    console.error("Container not found");
    return;
  }

  container.innerHTML = skeletonCardHTML(4);

  try {
    var trips = await fetchVisualTrips();
    visualTrips=trips;

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
          viewDetails(trip.id,"visual");
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

async function loadlastTrips() {
  var container = document.querySelector("#deals-container")
    if (!container) {
    console.error("Container not found");
    return;
  }
    container.innerHTML = skeletonCardHTML(4);

  try {
    var trips = await fetchlastTrips();
    lastTrips=trips || [];

    if (trips && trips.length > 0) {
      container.innerHTML = "";

      trips.forEach(function(trip) {
        const tripCard = document.createElement("div");
        tripCard.className = "trip-card";

        // Image
        const image = document.createElement("img");
        image.className = "trip-img";
        image.src = trip.media[0];
        image.alt = trip.name;
        tripCard.appendChild(image);

        // Body
        const tripBody = document.createElement("div");
        tripBody.className = "trip-body";

        const tripType = document.createElement("div");
        tripType.className = "trip-type";
        tripType.textContent = trip.type ?? "Popular"; // adjust to your data shape
        tripBody.appendChild(tripType);

        const tripTitle = document.createElement("div");
        tripTitle.className = "trip-title";
        tripTitle.textContent = trip.name;
        tripBody.appendChild(tripTitle);

        const tripLocation = document.createElement("div");
        tripLocation.className = "trip-location";
        tripLocation.textContent = trip.country;
        tripBody.appendChild(tripLocation);

        // Footer
        const tripFooter = document.createElement("div");
        tripFooter.className = "trip-footer";

        const tripPrice = document.createElement("div");
        tripPrice.className = "trip-price";
        tripPrice.innerHTML = `${parseFloat(String(trip.price).replace(/[^0-9.]/g,"")).toLocaleString("fr-DZ")} DA<span>/ppt</span>`; // adjust to your data shape

        const bookBtn = document.createElement("button");
        bookBtn.className = "btn-book";
        bookBtn.textContent = "Book Now";
        bookBtn.value=trip.id
        bookBtn.addEventListener("click", () => {
          viewDetails(trip.id,"last");
        });

        tripFooter.appendChild(tripPrice);
        tripFooter.appendChild(bookBtn);
        tripBody.appendChild(tripFooter);

        tripCard.appendChild(tripBody);
        container.appendChild(tripCard);
      });

      showToast("Last trips loaded successfully", "success", 2000);
    } else {
      container.innerHTML = '';
      showToast("No last trips available", "info");
    }
  } catch (err) {
    container.innerHTML = '';
    showToast("Using offline data — backend is not connected", "warning", 5000);
    console.warn("Could not load local trips from API:", err.message);
  }

  
}

async function loadLocalTrips() {
  var container = document.querySelector("#Local-trip");

  if (!container) {
    console.error("Container not found");
    return;
  }

  container.innerHTML = skeletonCardHTML(4);

  try {
    var trips = await fetchLocalTrips();
    localTrips=trips || [];

    if (trips && trips.length > 0) {
      container.innerHTML = "";

      trips.forEach(function(trip) {
        const tripCard = document.createElement("div");
        tripCard.className = "trip-card";

        // Image
        const image = document.createElement("img");
        image.className = "trip-img";
        image.src = trip.media[0];
        image.alt = trip.name;
        tripCard.appendChild(image);

        // Body
        const tripBody = document.createElement("div");
        tripBody.className = "trip-body";

        const tripType = document.createElement("div");
        tripType.className = "trip-type";
        tripType.textContent = trip.type ?? "Popular"; // adjust to your data shape
        tripBody.appendChild(tripType);

        const tripTitle = document.createElement("div");
        tripTitle.className = "trip-title";
        tripTitle.textContent = trip.name;
        tripBody.appendChild(tripTitle);

        const tripLocation = document.createElement("div");
        tripLocation.className = "trip-location";
        tripLocation.textContent = trip.country;
        tripBody.appendChild(tripLocation);

        // Footer
        const tripFooter = document.createElement("div");
        tripFooter.className = "trip-footer";

        const tripPrice = document.createElement("div");
        tripPrice.className = "trip-price";
        tripPrice.innerHTML = `${parseFloat(String(trip.price).replace(/[^0-9.]/g,"")).toLocaleString("fr-DZ")} DA<span>/ppt</span>`; // adjust to your data shape

        const bookBtn = document.createElement("button");
        bookBtn.className = "btn-book";
        bookBtn.textContent = "Book Now";
        bookBtn.value=trip.id
        bookBtn.addEventListener("click", () => {
          viewDetails(trip.id,"local");
        });

        tripFooter.appendChild(tripPrice);
        tripFooter.appendChild(bookBtn);
        tripBody.appendChild(tripFooter);

        tripCard.appendChild(tripBody);
        container.appendChild(tripCard);
      });

      showToast("Local trips loaded successfully", "success", 2000);
    } else {
      container.innerHTML = '';
      showToast("No local trips available", "info");
    }
  } catch (err) {
    container.innerHTML = '';
    showToast("Using offline data — backend is not connected", "warning", 5000);
    console.warn("Could not load local trips from API:", err.message);
  }
}

async function searchTrips() {
  var locationInput = document.getElementById("inp-where").value.trim();
  var startDateInput = document.getElementById("inp-checkin").value;
  var endDateInput = document.getElementById("inp-checkout").value;
  var adultsInput = document.getElementById("count-adults").textContent.trim();
  var childrenInput = document.getElementById("count-children").textContent.trim();
  var roomInput = document.getElementById("count-rooms").textContent.trim();
  if (!startDateInput || !endDateInput) {
      var params = {
      location: locationInput,
      startdate: null,
      enddate: null,
      numadults: parseInt(adultsInput),
      numchild: parseInt(childrenInput),
      rooms: parseInt(roomInput)
    };
  } else {
    var params = {
      location: locationInput,
      startdate: startDateInput,
      enddate: endDateInput,
      numadults: parseInt(adultsInput),
      numchild: parseInt(childrenInput),
      rooms: parseInt(roomInput)
    };
  }

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
  var travellerInput = document.getElementById("inp-travellers");

  var currentCount = parseInt(countEl.textContent);
  var newCount = Math.max(0, currentCount + delta);
  countEl.textContent = newCount;

  if (travellerInput) {
    var adults = parseInt(document.getElementById("count-adults").textContent) || 0;
    var children = parseInt(document.getElementById("count-children").textContent) || 0;
    var rooms = parseInt(document.getElementById("count-rooms").textContent) || 0;
    var parts = [];

    if (adults > 0) {
      parts.push(adults + " adult" + (adults !== 1 ? "s" : ""));
    }
    if (children > 0) {
      parts.push(children + " child" + (children !== 1 ? "ren" : ""));
    }
    if (rooms > 0) {
      parts.push(rooms + " room" + (rooms !== 1 ? "s" : ""));
    }

    travellerInput.placeholder = parts.length ? parts.join(", ") : "Add travellers";
  }
}

document.querySelectorAll("section").forEach(function (section) {
  var arrows = section.querySelectorAll(".nav-arrow");
  if (arrows.length < 2) return;

  // Find the scrollable row inside this section
  var row = section.querySelector(".cards-row, .trips-grid");
  if (!row) return;

  // Make the row horizontally scrollable
  row.style.overflowX    = "auto";
  row.style.scrollBehavior = "smooth";
  row.style.display      = "flex";       // override grid so it scrolls
  row.style.flexWrap     = "nowrap";

  // Each card keeps a fixed width so they don't squish
  row.querySelectorAll(".deal-card, .trip-card").forEach(function (card) {
    card.style.minWidth = "240px";
    card.style.flex     = "0 0 auto";
  });

  var scrollAmount = 260;

  arrows[0].addEventListener("click", function () {
    row.scrollLeft -= scrollAmount;
  });

  arrows[1].addEventListener("click", function () {
    row.scrollLeft += scrollAmount;
  });
});
function viewDetails(tripId,where) {
  sessionStorage.removeItem("selectedTrip");
  switch (where) {
    case "visual":
      var trip = visualTrips.find(function (t) {
        return String(t.id) === String(tripId);
      });

      if (!trip) {
        console.warn("Trip not found:", tripId);
        return;
      }
      break;
    case"local":
      var trip = localTrips.find(function (t) {
          return String(t.id) === String(tripId);
        });

        if (!trip) {
          console.warn("Trip not found:", tripId);
          return;
        }
      break;
      case"last":
            var trip = lastTrips.find(function (t) {
            return String(t.id) === String(tripId);
          });

          if (!trip) {
            console.warn("Trip not found:", tripId);
            return;
          }
        break;
  }
  sessionStorage.setItem("selectedTrip", JSON.stringify(trip));
  window.location.href = "details.html";
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  loadVisualTrips();
  loadLocalTrips();
  loadlastTrips();
});
