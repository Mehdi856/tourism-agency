var params = JSON.parse(sessionStorage.getItem("searchParams"));
var trips  = JSON.parse(sessionStorage.getItem("searchResults"));

document.addEventListener("DOMContentLoaded", function() {
  var params = JSON.parse(sessionStorage.getItem("searchParams"));
  var trips  = JSON.parse(sessionStorage.getItem("searchResults"));

  if (!params || !trips) {
    console.warn("No search data found in session.");
    return;
  }

  console.log("Loaded search params:", params);
  console.log("Loaded trips:", trips);

  // Fill in params
  var whereEl    = document.getElementById("inp-where");
  var checkinEl  = document.getElementById("inp-checkin");
  var checkoutEl = document.getElementById("inp-checkout");
  var adultsEl   = document.getElementById("count-adults");
  var childrenEl = document.getElementById("count-children");
  var roomsEl    = document.getElementById("count-rooms");
  var resultstitle = document.getElementsByClassName("results-title");
    if (resultstitle) {
      resultstitle[0].textContent="Experiences in " + params.location;
    }
  var numbers =document.getElementById("results-count")
    if (numbers) {
      numbers.textContent=trips.length;
    }


  if (whereEl)    whereEl.value       = params.location;
  if (checkinEl)  checkinEl.value     = params.startdate;  // was: params.checkin
  if (checkoutEl) checkoutEl.value    = params.enddate;    // was: params.checkout
  if (adultsEl)   adultsEl.textContent  = params.numadults;
  if (childrenEl) childrenEl.textContent = params.numchild;
  if (roomsEl)    roomsEl.textContent   = params.rooms;

  renderTrips(trips);
});

function renderTrips(data) {
  var container = document.getElementById("cards-container");
  var noResults = document.getElementById("no-results");
  if (!container || !noResults) return;

  if (!data || data.length === 0) {
    container.innerHTML = "";
    noResults.classList.add("show");
    return;
  }
  noResults.classList.remove("show");

  var adults   = params.numadults;
  var children = params.numchild;

  var travStr = adults + (adults === 1 ? " adult" : " adults");
  if (children > 0) {
    travStr += " & " + children + (children === 1 ? " child" : " children");
  }

  // Parse dates from "[2025-06-01,2025-06-10)"
  function parseDates(dateRange) {
    var clean = dateRange.replace(/[\[\]\(\)]/g, "");
    var parts = clean.split(",");
    return { checkin: parts[0], checkout: parts[1] };
  }

  // Star rating from hotel.rating
  function getStars(rating) {
    var stars = "";
    for (var i = 0; i < 5; i++) {
      stars += i < rating ? "★" : "☆";
    }
    return stars;
  }

  container.innerHTML = data.map(function(item, i) {
    var dates   = parseDates(item.date);
    var img     = (item.media && item.media.length > 0) ? item.media[0] : "placeholder.jpg";
    var hotel   = item.hotel || {};

    return ''
    + '<div class="experience-card" style="animation-delay:' + (i * 0.06) + 's">'
      + '<div class="card-img-wrap">'
        + '<img class="card-img" src="' + img + '" alt="' + item.name + '" loading="lazy">'
        + (item.visual ? '<div class="signature-badge">✦ Signature Collection</div>' : '')
        + '<button class="wishlist-btn" onclick="toggleWishlist(this)" title="Save">♡</button>'
      + '</div>'
      + '<div class="card-body">'
        + '<div class="card-top">'
          + '<div class="card-title">' + item.name + '</div>'
          + '<div class="info-box">'
            + '<div class="info-segment"><div class="info-seg-label">Country</div><div class="info-seg-value">' + item.country + '</div></div>'
            + '<div class="info-segment"><div class="info-seg-label">Hotel</div><div class="info-seg-value blue">' + (hotel.name || "N/A") + '</div><div class="rating-stars">' + getStars(hotel.rating || 0) + '</div></div>'
            + '<div class="info-segment"><div class="info-seg-label">Price</div><div class="info-seg-value blue">' + item.price + '</div><div style="font-size:10px;color:var(--muted)">' + travStr + '</div></div>'
          + '</div>'
        + '</div>'
        + '<div class="card-meta">'
          + '<div class="meta-item">📅 ' + dates.checkin + ' → ' + dates.checkout + '</div>'
          + '<div class="meta-item">👥 ' + item.adults + ' adults · ' + item.children + ' children · ' + item.room + ' room(s)</div>'
          + '<div class="meta-item">📍 ' + item.places + ' places to visit</div>'
        + '</div>'
        + '<div class="card-body">'
          + '<p style="font-size:13px;color:var(--muted)">' + item.description + '</p>'
        + '</div>'
        + '<div class="card-footer">'
          + '<div class="price-wrap">'
            + '<div class="price-main">' + item.price + '</div>'
            + '<div class="price-sub">for ' + travStr + '</div>'
          + '</div>'
          + '<button class="view-btn" onclick="viewDetails(' + item.id + ')">View Details →</button>'
        + '</div>'
      + '</div>'
    + '</div>';
  }).join("");
}


async function updateSearch() {
  sessionStorage.removeItem("searchParams");
  sessionStorage.removeItem("searchResults");
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

  renderTrips(trips);

}


function toggleTravellersDropdown() {
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


