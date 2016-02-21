var uberClientId = "qcKD5guOOuK2xIJv2PYzCdJiNhxYR4sR";
var uberServerToken = "dhZm1hsWb82mbLaIZEKbhC434qDZl_0qcin9KPfd";

var imageStrings = ["uberLogo.png", "drivingImg.png", "walkingLogo.png", "bikeLogo.png", "transitLogo.png"];

var startLoc;
var dest;

var mpg = 26;
var gasPrice = 1.8;

var uberPrice;
var uberLow;
var uberHigh;
var uberTime;
var uberSurge;

var compPrice;
var compTime;

var drivingPrice;
var drivingTime;

var walkingPrice;
var walkingTime;
var bicylePrice;
var bicyleTime;

var transitPrice;
var transitTime;


function submitAddresses() {
    startLoc = document.getElementById("startLocation").value;
    dest = document.getElementById("destination").value;

    if (startLoc == "" || dest == "") return;

    document.getElementById("startLocation").value = "";
    document.getElementById("destination").value = "";

    getUberEstimate(startLat, startLon);

    updateMap(startLoc, dest);
}

function sortPrices() {
    var uber = [0, uberHigh, uberTime, uberLow];
    var driving = [1, drivingPrice, drivingTime];
    var walking = [2, walkingPrice, walkingTime];
    var bike = [3, bicylePrice, bicyleTime];
    var transit = [4, transitPrice, transitTime];

    var transportation = [uber, driving, walking, bike, transit];
    var sorted = [uber, driving, walking, bike, transit];
    var count = 0;

    transportation.sort(function(a, b) {
        return a[1] - b[1]
    });

    for (var i = 0; i < transportation.length; i++) {
        if (transportation[i][1] != 0) {
            sorted[count] = transportation[i];
            count++;
        }
    }

    for (var i = 0; i < transportation.length; i++) {
        if (transportation[i][1] == 0) {
            sorted[count] = transportation[i];
            count++;
        }
    }

    /*

    for (var x = 0; x < sorted.length; x++) {
        var temp = sorted[x];
        if (temp[1] == 0) {
            alert("entered" + temp[0]);
            for (var y = 0; y < x; y++) {
                var tempTwo = sorted[y];
                if (temp[2] <= tempTwo[2] + 5) {
                    sorted.splice(y, 0, temp);
                    alert(sorted[y][0]);
                    sorted.splice(x, 1);
                    alert(sorted[x][0]);
                }
            }
        }
    }
    */

    console.log(sorted);
    document.getElementById('tiles').innerHTML = "";

    for (var i = 0; i < sorted.length; i++) {
        geVarsFromObj(sorted[i]);
    }
}

function getUberEstimate(latitude, longitude) {
    $.ajax({
        url: "https://api.uber.com/v1/estimates/price",
        headers: {
            Authorization: "Token " + uberServerToken
        },
        data: {
            start_latitude: startLat,
            start_longitude: startLon,
            end_latitude: destLat,
            end_longitude: destLon
        },
        success: function(result) {
            uberSurge = result.prices[0].surge_multiplier;
            uberPrice = result.prices[0].estimate;
            uberTime = result.prices[0].duration / 60;

            uberPrice = uberPrice.replace("$", "");
            uberLow = parseInt(uberPrice.split("-")[0]);
            uberHigh = parseInt(uberPrice.split("-")[1]);

            uberLow *= uberSurge;
            uberHigh *= uberSurge;

            uberLow = parseInt(uberLow * 100) / 100;
            uberHigh = parseInt(uberHigh * 100) / 100;

            console.log("Uber: " + uberPrice + ", " + uberTime + ", " + uberSurge);
            calculateRoute(startLoc, dest, google.maps.TravelMode.DRIVING);
        }
    });
}

function calculateRoute(start, dest, routeMode) {
    var directionsService = new google.maps.DirectionsService;
    directionsService.route({
        origin: start,
        destination: dest,
        travelMode: routeMode
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK && response != null) {
            switch (routeMode) {
                case google.maps.TravelMode.DRIVING:
                    drivingPrice = (response.routes[0].legs[0].distance.value * 0.000621371) / mpg * gasPrice;
                    drivingTime = response.routes[0].legs[0].duration.value / 60;
                    console.log("Driving: $" + drivingPrice + ", " + drivingTime + " minutes");
                    calculateRoute(start, dest, google.maps.TravelMode.WALKING);
                    break;

                case google.maps.TravelMode.WALKING:
                    walkingPrice = 0
                    walkingTime = response.routes[0].legs[0].duration.value / 60;
                    console.log("Walking: $" + walkingPrice + ", " + walkingTime + " minutes");
                    calculateRoute(start, dest, google.maps.TravelMode.BICYCLING);
                    break;

                case google.maps.TravelMode.BICYCLING:
                    bicylePrice = 0
                    bicyleTime = response.routes[0].legs[0].duration.value / 60;
                    console.log("Bicycling: $" + bicylePrice + ", " + bicyleTime + " minutes");
                    calculateRoute(start, dest, google.maps.TravelMode.TRANSIT);
                    break;

                case google.maps.TravelMode.TRANSIT:
                    if (response.routes[0].fare == null) {
                        console.log("No transit options");
                        sortPrices();
                        return;
                    }
                    transitPrice = response.routes[0].fare.value;
                    transitTime = response.routes[0].legs[0].duration.value / 60;
                    console.log("Transit: $" + transitPrice + ", " + transitTime + " minutes");
                    sortPrices();
                    break;
            }
        }
        else {
            sortPrices();
            window.alert('Directions request failed due to ' + status);
            switch (routeMode) {
                case google.maps.TravelMode.DRIVING:
                    console.log("driving fucked up");
                    break;

                case google.maps.TravelMode.WALKING:
                    console.log("walking fucked up");
                    break;

                case google.maps.TravelMode.BICYCLING:
                    console.log("bicycling fucked up");
                    break;

                case google.maps.TravelMode.TRANSIT:
                    console.log("transit fucked up");
                    break;
            }
        }
    });
}

function updateMap(start, dest) {
    var directionsService = new google.maps.DirectionsService;

    directionsService.route({
        origin: start,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        }
        else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

function geVarsFromObj(obj) {
    var objTime = parseInt(obj[2] / 60) + "h " + parseInt(obj[2] % 60) + "m";
    var objId = parseInt(obj[0]);
    var objPrice = "";

    if (objId == 0) {
        objPrice = obj[3] + "-" + obj[1];
    }
    else {
        objPrice = parseInt(obj[1] * 100) / 100;
    }

    addTile(objTime, objId, objPrice);
}

function addTile(objTime, objId, objPrice) {
    var div = document.createElement('div');

    div.className = "row";

    if (isNaN(objPrice) && objId == 4) {
        div.innerHTML = '<button class="tile btn btn-default"> \
            <div class = "col-md-5 tileImage" >\
                <img class="img-responsive" src="img/' + imageStrings[objId] + '">\
            </div>\
            <div class="col-md-7 tileTextContainer">\
                <div class="tileText">\
                    <p>Not</p>\
                    <p>Available</p>\
                </div>\
            </div>\
        </button>';
    }

    else if (objId == 0) {
        div.innerHTML = '<button class="tile btn btn-default"> \
            <div class = "col-md-5 tileImage" >\
                <a href="https://www.uber.com/">\
                    <img class="img-responsive" src="img/' + imageStrings[objId] + '">\
                </a>\
            </div>\
            <div class="col-md-7 tileTextContainer">\
                <div class="tileText">\
                    <p>$' + objPrice + '</p>\
                    <p>' + objTime + '</p>\
                </div>\
            </div>\
        </button>';
    }


    else {
        div.innerHTML = '<button  class="tile btn btn-default"> \
            <div class = "col-md-5 tileImage" >\
                <a href="https://www.google.com/maps/dir/' + startLoc.split(" ").join("%20") + '/ + ' + dest.split(" ").join("%20") + ' /">\
                    <img class="img-responsive" src="img/' + imageStrings[objId] + '">\
                </a>\
            </div>\
            <div class="col-md-7 tileTextContainer">\
                <div class="tileText">\
                    <p>$' + objPrice + '</p>\
                    <p>' + objTime + '</p>\
                </div>\
            </div>\
        </button>';
    }

    document.getElementById('tiles').appendChild(div);
}