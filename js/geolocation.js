var geolocation = (function () {
    var dfd = jQuery.Deferred();
    var googleMapsLoaded = false;
    function loadGoogleMaps() {
        if (!googleMapsLoaded) {
            googleMapsLoaded = true;
            var script_tag = document.createElement('script');
            script_tag.setAttribute("type", "text/javascript");
            script_tag.setAttribute("src", "http://maps.googleapis.com/maps/api/js?sensor=false");
            (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
        }       
    }    

    function getUF() {
        loadGoogleMaps();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
        }
        else {
            console.log("Browser unable to get geolocation.");
        }
        return dfd.promise();
    }

    //Get the latitude and the longitude;
    function successFunction(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        geocoder = new google.maps.Geocoder();
        codeLatLng(lat, lng)
    }

    function errorFunction() {
        console.log("Geolocation failed to get UF");
    }

    function codeLatLng(lat, lng) {

        var latlng = new google.maps.LatLng(lat, lng);
        geocoder.geocode({ 'latLng': latlng }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                console.log(results)
                if (results[1]) {
                    //find country name
                    for (var i = 0; i < results[0].address_components.length; i++) {
                        for (var b = 0; b < results[0].address_components[i].types.length; b++) {

                            //there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
                            if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
                                //this is the object you are looking for
                                city = results[0].address_components[i];
                                break;
                            }
                        }
                    }
                    //city data
                    dfd.resolve(city.short_name);

                } else {
                    console.log("No results found");
                }
            } else {
                console.log("Geocoder failed due to: " + status);
            }
        });
    }

    return {
        getUF: getUF
    };
})();