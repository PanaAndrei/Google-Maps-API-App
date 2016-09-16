var openWindow = {};
var directionsDisplayArray = [];
var markers = [];
var currentLocationInfoWindow = {};

function initAutocomplete() {
    var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.157529, lng: 27.588374},
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

    google.maps.InfoWindow.prototype.opened = false;
    map.data.setStyle({});

  // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  //Create the show route button
    var showRoute = document.getElementById('showRoute');
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(showRoute);
    $("#showRoute").css({"margin-left": "20px", "cursor": "pointer"});
  
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
    searchBox.addListener('places_changed', function() {
      getSearchBoxPlaces(map, searchBox);  
    });

    //Handler for the event triggered by pushing the show route button
    showRoute.addEventListener("click", function() {
      var infoWindow = new google.maps.InfoWindow({map: map});

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          infoWindow.setPosition(currentPosition);
          infoWindow.setContent('You\'re here!');
          map.setCenter(currentPosition);

          // Retrieve the places from search box and create a route from current location to each of them
          var places = getSearchBoxPlaces(map, searchBox);
          currentLocationInfoWindow = infoWindow;
          currentLocationInfoWindow.opened = true;

          places.forEach(function(place) {
            displayRoute(map, currentPosition, place.geometry.location);
          });
        }, function() {
        // The Geolocation service failed  
          handleLocationError(true, infoWindow, map.getCenter());
        });
      } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
      }
  });
}

function closeGeolocationInfoWindowIfOpened() {
  if (currentLocationInfoWindow.opened) {
    currentLocationInfoWindow.close();
  }
}

function getSearchBoxPlaces(map, searchBox) {
  var places = searchBox.getPlaces();

  if (places.length == 0) {
    return;
  }

  // Clear out the old markers.
  markers.forEach(function(marker) {
    marker.setMap(null);
  });
  
  markers = [];
  emptyArrayOfDirectionsRenderers();
  closeGeolocationInfoWindowIfOpened();

  // For each place, get the icon, name and location.
  var bounds = new google.maps.LatLngBounds();
  places.forEach(function(place) {
    var icon = {
      url: "flag.png",
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(50, 50)
    };

    // Create a marker for each place.
    var marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location
     });

    markers.push(marker);

    if (place.geometry.viewport) {
    // Only geocodes have viewport.
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }

     var infowindow = new google.maps.InfoWindow({
        content: place.name
      }); 

     marker.addListener('click', function() {
        if (openWindow.opened) {
          openWindow.close();
        }
        infowindow.open(map, marker);
        infowindow.opened = true;
        openWindow = infowindow;        
      });
  });
  
  map.fitBounds(bounds);
  return places;
}

function displayRoute(map, currentLocation, searchedLocation) {
  // initialize directions service and renderer
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;

  directionsService.route({
      origin: currentLocation,
      destination: searchedLocation,
      travelMode: google.maps.TravelMode.WALKING
    }, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setMap(map);
        directionsDisplay.setOptions({suppressMarkers: true});
        directionsDisplay.setDirections(response);
      }
    }
  );

  directionsDisplayArray.push(directionsDisplay);
}

function emptyArrayOfDirectionsRenderers() {
  directionsDisplayArray.forEach(function(directionsDisplay) {
    directionsDisplay.setMap(null);
  });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}
