var startLat = 0;
var startLon = 0;
var destLat = 0;
var destLon = 0;

var directionsDisplay;

function initAutocomplete() {
  // Create the autocomplete object, restricting the search to geographical
  // location types.
  startLocation = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */
    (document.getElementById('startLocation')), {
      types: ['geocode']
    });

  destination = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */
    (document.getElementById('destination')), {
      types: ['geocode']
    });

  // When the user selects an address from the dropdown, populate the address
  // fields in the form.
  startLocation.addListener('place_changed', fillInStart);
  destination.addListener('place_changed', fillInDest);

  initMap();
}

function fillInStart() {
  // Get the place details from the autocomplete object.
  var startPlace = startLocation.getPlace();

  startLat = startPlace.geometry.location.lat();
  startLon = startPlace.geometry.location.lng();
}

function fillInDest() {
  // Get the place details from the autocomplete object.
  var destPlace = destination.getPlace();

  destLat = destPlace.geometry.location.lat();
  destLon = destPlace.geometry.location.lng();
}




// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      startLocation.setBounds(circle.getBounds());
      destination.setBounds(circle.getBounds());
    });
  }
}

function initMap() {
  var directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer;

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 7,
    center: {
      lat: 41.85,
      lng: -87.65
    }
  });

  directionsDisplay.setMap(map);

  document.getElementById("map").style.height = window.innerHeight + 'px';
}