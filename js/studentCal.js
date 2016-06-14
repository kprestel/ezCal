$(document).ready(function () {
    displayCalendar();
});

function displayCalendar() {
    $.ajax({
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data: "{}",
        url: "/CalendarService.asmx/getEventList",
        dataType: "json",
        success: function (data) {
            $('#calendar').fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,agendaWeek,agendaDay'
                },
                selectable: true,
                selectHelper: true,
                select: function (start, end) {
                    showPopUp(start, end);
                },
                editable: false,
                droppable: false,
                draggable: false,
                lazyFetching: false,
                defaultTimedEventDuration: '01:00:00',
                forceEventDuration: true,
                eventTextColor: 'White',
                events:
                $.map(data.d, function (item, i) {
                    console.log(item);
                    console.log(item);
                    var event = new Object();
                    event.id = item.eventID;
                    event.start = moment(item.eventStartDate);
                    event.end = moment(item.eventEndDate);
                    event.title = item.eventTitle;
                    event.description = item.eventDescription;
                    event.topic = item.eventTopic;
                    event.placeID = item.eventPlaceID;
                    event.allDay = false;
                    console.log(event);
                    return event;
                }),
                eventRender: function (event, element) {
                    element.qtip({
                        content: event.title + "<br>" + event.start.format('MM-DD h:mm') + " - " +
                            event.end.format('MM-DD h:mm'),
                        position: { corner: { tootltip: 'bottomLeft', target: 'topRight' } },
                        style: {
                            border: {
                                width: 1,
                                radius: 3,
                                color: 'green'
                            },
                            padding: 10,
                            textAlign: 'left',
                            tip: true
                        }
                    });

                    switch (event.topic) {
                        case 'MC':
                            element.addClass('MC');
                            break;
                        case 'B-Boy':
                            element.addClass('B-Boy');
                            break;
                        case 'DJ':
                            element.addClass('DJ');
                            break;
                        case 'Graffiti':
                            element.addClass('Graffiti');
                            break;
                        case 'General':
                            element.addClass('General');
                            break;
                        case 'Community Service':
                            element.addClass('Community-Service');
                            break;
                        default:
                            element.addClass('General');
                            break;
                    }
                },
                eventAfterRender: function (event, element, view) {
                    if ($(this).data("qtip")) $(this).qtip('destroy');
                },
                eventResize: function (event, dayDelta, minuteDelta, revertFunc) {
                    if ($(this).data("qtip")) $(this).qtip('destroy');
                    //alert(event.title + " end time is now " + event.end.format('YYYY-MM-DD h:mm:ss'));
                    if (!confirm("Are you sure you want to change " + event.title + "'s time to "
                        + event.end.format('YYYY-MM-DD h:mm:ss'))) {
                        revertFunc();
                    }
                    else {
                        updateEvent(event);
                    }
                },
                eventDrop: function (event, dayDelta, minuteDelta, allDay, revertFunc) {
                    if ($(this).data("qtip")) $(this).qtip('destroy');
                    if (!confirm("Are you sure you want to change " + event.title + "'s date to "
                        + event.start.format('YYYY-MM-DD h:mm:ss') + " - " + event.end.format('YYYY-MM-DD h:mm:ss'))) {
                        revertFunc();
                    }
                    else {
                        updateEvent(event);
                    }
                    if ($(this).data("qtip")) $(this).qtip('destroy');
                },
                eventDurationEditable: false, // change an events duration by dragging!
                disableResizing: true,
                startEditable: false,
                eventAfterAllRender: function (view) { },
                drop: function (date) {
                    eventDropped(date, this);
                },
                eventReceive: function (event) {
                    updateEvent(event);
                },
                eventClick: function (event) {
                    showEventClickedPopUp(event);
                },
                eventDestroy: function (event, element, view) { },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    debugger;
                }
            });
        }
    });
}

function showEventClickedPopUp(event) {
    $("#eventInfoDialog").dialog({
        autoOpen: false,
        height: 600,
        width: 600,
        show: {
            effect: "blind",
            duration: 1000,
        },
        hide: {
            effect: "explode",
            duration: 1000
        },
    });
    initMap(event.placeID);
    document.getElementById('eventTitle').innerHTML = "<p>Event Title: " + event.title + "</ br></p>";
    document.getElementById('eventTopic').innerHTML = "<p>Event Topic: " + event.topic + "</ br></p>";
    document.getElementById('eventStartDate').innerHTML = "<p>Start Time: " + event.start.format('MM-DD-YYYY h:mm') + "</ br></p>";
    document.getElementById('eventEndDate').innerHTML = "<p>End Time: " + event.end.format('MM-DD-YYYY h:mm') + "</ br></p>";
    document.getElementById('eventDescription').innerHTML = "<p>Event Description: " + event.description + "</ br></p>";

    $('#eventInfoDialog').dialog('open');
}

function getGeoLocation() {
    if (navigator.geolocation) {
        var positionOptions = {
            enableHighAccuracy: true,
            timeout: 10 * 1000
        };
        navigator.geolocation.getCurrentPosition(success, error, positionOptions);
    }
    else {
        console.log(Error);
    }
}

function error(error) {
    console.log(error.code);
}

function initService() {
    service = new google.maps.places.PlacesService();
}

function geocodePlaceId(geocoder, map, infoWindow, placeID) {
    geocoder.geocode({ 'placeId': placeID }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                console.log(placeID);
                map.setZoom(11);
                map.setCenter(results[0].geometry.location);
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location
                });
                var content = ["<div id='mapContent'>" + results[0].formatted_address + "</div>"];
                infoWindow.setContent(content.toString());
                google.maps.event.addListener(infoWindow, 'domready', function () {
                    document.getElementById("mapContent").addEventListener('click', function () {
                        window.open('https://maps.google.com/?q=' + results[0].formatted_address);
                    });
                });
                infoWindow.open(map, marker);
            } else {
                alert('No Results Found');
            }
        } else {
            alert('Geocoder failed due to ' + status);
            console.log(error);
        }
    });
}

function initMap(placeID) {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        mapTypeID: google.maps.MapTypeId.ROADMAP,
        zoom: 7
    });
    var infoWindow = new google.maps.InfoWindow;
    var geocoder = new google.maps.Geocoder;
    geocodePlaceId(geocoder, map, infoWindow, placeID);
}