"use strict";
$(document).ready(function() {
initExternalEventTimeAutoComplete();
loadEventTypes();
createExternalEventsOnLoaD();
getTimeFormatPrefence();
initDroppables();
loadEvents();
// loadUserSettings();
displayCalendar();
});
var eventArray = [];
var eventTypeArray = [];
//var userSettings = {};
// var gEventArray = [];
var value;
var placeSearch, autoComplete, place;

function displayCalendar() {
$('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        selectable: true,
        selectHelper: true,
        select: function(start, end) {
            showPopUp(start, end);
        },
        editable: true,
        droppable: true,
        unselectAuto: true,
        draggable: true,
        default: getDefaultEventLength(),
        lazyFetching: false,
        forceEventDuration: true,
        eventTextColor: 'White',
        // attach qtip UI element 
        eventRender: function(event, element) {
            element.qtip({
                content: event.title + "<br>" + event.start.format('MM-DD h:mm') + " - " +
                    event.end.format('MM-DD h:mm'),
                position: {
                    corner: {
                        tootltip: 'bottomLeft',
                        target: 'topRight'
                    }
                },
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
            // TODO: refactor to remove element from this call
            var bg = injectEventCategoryCSS(event, element);
            // console.log(element);
            element.css('background-color', bg);
            // console.log(element);
        },
        eventAfterRender: function(event, element, view) {
            if ($(this).data("qtip")) $(this).qtip('destroy');
        },
        eventResize: function(event, dayDelta, minuteDelta, revertFunc) {
            if ($(this).data("qtip")) $(this).qtip('destroy');
            if (!confirm("Are you sure you want to change " + event.title + "'s end time to " + event.end.format('MM-DD h:mm'))) {
                revertFunc();
            } else {
                updateEvent(event);
            }
            if ($(this).data("qtip")) $(this).qtip('destroy');
        },
        eventDrop: function(event, dayDelta, minuteDelta, allDay, revertFunc) {
            if ($(this).data("qtip")) $(this).qtip('destroy');
            if (!confirm("Are you sure you want to change " + event.title + "'s date to " + event.start.format('MM-DD h:mm') + " - " + event.end.format('MM-DD h:mm'))) {
                revertFunc();
            } else {
                updateEvent(event);
            }
            if ($(this).data("qtip")) $(this).qtip('destroy');
        },
        eventDurationEditable: true, // change an events duration by dragging!
        disableResizing: true,
        startEditable: true,
        eventAfterAllRender: function(view) {},
        drop: function(date) { // called when a external event is dropped
            eventDropped(date, this);
            if ($(this).data("qtip")) $(this).qtip('destroy');
        },
        // doesn't do anything?
        eventReceive(event){
            var bg = injectEventCategoryCSS(event);
            console.log(event);
            console.log(bg);
        },
        eventClick: function(event) {
            showEventClickedPopUp(event);
        },
        eventDestroy: function(event, element, view) {
            element.qtip('destroy');
        },
        // track UI element stop location and check for deletion 
        eventDragStop: function(event, jsEvent) {
            var trash = jQuery('#trashCan');
            var ofs = trash.offset();
            var x1 = ofs.left;
            var x2 = ofs.left + trash.outerWidth(true);
            var y1 = ofs.top;
            var y2 = ofs.top + trash.outerHeight(true);

            if (jsEvent.pageX >= x1 && jsEvent.pageX <= x2 && jsEvent.pageY >= y1 && jsEvent.pageY <= y2) {
                deleteEvent(event);
            }

            $("#calendar").fullCalendar('unselect');
        },
        dragRevertDuration: 0,
    });
}

function loadEvents() {
    if (localStorage.eventArray) {
        eventArray = JSON.parse(localStorage.eventArray);
    }
    // if (localStorage.gEventArray) {
    //         gEventArray = localStorage.gEventArray;
    // }
}

function saveLocalEvents() {
    localStorage.setItem('eventArray', JSON.stringify(eventArray));
}

function saveEventTypes() {
    localStorage.setItem('eventTypeArray', JSON.stringify(eventTypeArray));
}

function loadEventTypes() {
    if (localStorage.eventTypeArray) {
        eventTypeArray = JSON.parse(localStorage.eventTypeArray);
    } else{
        var generalEvent = {};
        generalEvent.category = 'General';
        generalEvent.color = 'dodgerblue';
        eventTypeArray[0] = generalEvent;
        saveEventTypes();
    }
}

function loadUserSettings(){
    if (localStorage.userSettings) {
        userSettings = JSON.parse(localStorage.userSettings);
    }
}

// saves event to eventArray 
// used for both intial save and 
// later edits to the event
function updateEvent(event) {
    var desc;
    var location;
    var eventToSave = {};
    if (event.placeID) {
        location = event.placeID; // formatted address for gCal
        // placeID is handled on google's end
    }
    if (event.description) {
        desc = event.description;
    }
    if (event.allDay) {
        eventToSave = {
            'summary': event.title,
            'location': location,
            'description': desc,
            'start': {
                'date': event.start.format("YYYY-MM-DD")
            },
            'end': {
                'date': event.end.format("YYYY-MM-DD")
            }
        };

    } else {
        eventToSave = {
            'summary': event.title,
            'location': location,
            'description': desc,
            'start': {
                'dateTime': event.start.utc(),
                'timeZone': moment.tz.guess()
            },
            'end': {
                'dateTime': event.end.utc(),
                'timeZone': moment.tz.guess()

            }
        };
    }
    console.log(eventToSave);
    var request = gapi.client.calendar.events.insert({
        'calendarId': getCalIdPrefence(),
        'resource': eventToSave
    });
    console.log(request);
    request.execute(function(response) {
        if (!response) {
            console.log('error inserting event');
            console.log(response);
        } else {
            console.log('event inserted');
            console.log(response);
            console.log(response.id);
            console.log(event.category);
            // save event ID and category in local storage
            var localEvent = {};
            localEvent.id = response.id;
            localEvent.category = event.category;
            eventArray.push(localEvent);
            saveLocalEvents();
        }
    });
}
// adds drag/drop functionality to the external events
// adds basic attributes to the event objects
function initDroppables() {
    $('#external-events .fc-event').each(function() {
        $(this).data('event', {
            category: $(this).text(),
            title: $(this).text(),
            stick: false
        });
        $(this).draggable({
            zIndex: 999,
            revert: "invalid",
            // help: "clone",
            drop: function() {
                $("#calendar").fullCalendar('unselect');
            },
            // destroy: function(){
            //     $(this).remove();
            // },

            revertDuration: 0
        });
    });

    $("#btnNewEventType").click(function() {
        createNewEventType();
    });
}

function createNewEventType() {
    $("#eventTypeForm").dialog({
        autoOpen: false,
        height: 250,
        width: 250,
        title: 'Create New Event Type',
        modal: true,
        buttons: {
            "Create": function() {
                var eventConfig = {};
                eventConfig.category = $("#txtEventCategory").val();
                eventConfig.color = '#' + value;
                createExternalEventFromDialog(eventConfig);
                eventTypeArray.push(eventConfig);
                saveEventTypes();
                $("#eventTypeForm").dialog("close");
            },
            Cancel: function() {
                $("#eventTypeForm").dialog("close");
            }
        },
        close: function() {
            $("#eventTypePopUpForm")[0].reset();
        }
    });
    $("#eventTypeForm").dialog("open");
}
// creates a new external event type
// new external events will load each time refreshed
function createExternalEventFromDialog(eventConfig) {
    $("head").append('<style type="text/css"> .' + eventConfig.category + '{background-color:' + eventConfig.color + '; </style>');
    $("#external-events").append(
        '<div id="' + eventConfig.category + '" class="fc-event ' + eventConfig.category + '">' + eventConfig.category + '</div>');
    initDroppables();
}

function createExternalEventsOnLoaD() {
    for (var i = 0; i < eventTypeArray.length; i++) {
        var eventConfig = eventTypeArray[i];
        $("head").append('<style type="text/css"> .' + eventConfig.category + '{background-color:' + eventConfig.color + '; </style>');
        $("#external-events").append(
            '<div id="' + eventConfig.category + '" class="fc-event ' + eventConfig.category + '">' + eventConfig.category + '</div>');
    }
}

// styles each event on the calendar according to their category 
function injectEventCategoryCSS(event, element) {
    var category;
    if(!event.category){
    for (var i = 0; i < eventArray.length; i++) {
        if (eventArray[i].id == event.id) {
            category = eventArray[i].category;
            break;
        }
    }
    }else{
        category = event.category;
    }
    // for (var i = 0; i < eventArray.length; i++) {
    //     if (eventArray[i].id == event.id) {
    //         category = eventArray[i].category;
    //         break;
    //     }
    // }
    if (category) {
        for (var i = 0; i < eventTypeArray.length; i++) {
            if (eventTypeArray[i].category == category) {
                // element.css("background-color", eventTypeArray[i].color);
                return eventTypeArray[i].color;
                break;
            }
        }
    }
}

function setEventColor(picker) {
    var jsColor = picker;
    //console.log(jsColor.toString());
    value = jsColor.toString();
    return value;
}

// deletes event from users gcal
// when it is dropped in the trashcan
function deleteEvent(event) {
    var request = gapi.client.calendar.events.delete({
        'calendarId': getCalIdPrefence(),
        'eventId': event.id
    });

    request.execute(function(response) {
        if (!response) {
            console.log('event delete threw error');
            console.log(response);
        } else {
            console.log('event deleted');
        }
    });

    $('#calendar').fullCalendar('removeEvents', event.id);
}
// called when an existing event's date/time 
// is changed by being dropped on the calendar
// not sure actually if it is existing
function eventDropped(date, externalEvent) {
    var event_object;
    var copiedEventObject;
    console.log($("#txtStartTime").data('timeAutocomplete').getTime());
    // get desired date and time for the event 
    var startTime = $("#txtStartTime").data('timeAutocomplete').getTime();
    var i = startTime.indexOf(":");
    var startHour = startTime.substring(0, i);
    startHour = parseInt(startHour, 10);
    var startMin = startTime.substring(i + 1, i + 3);
    startMin = parseInt(startMin, 10); // may cause display issues 

    var endTime = $("#txtEndTime").data('timeAutocomplete').getTime();
    var x = endTime.indexOf(":");
    var endHour = endTime.substring(0, x);
    endHour = parseInt(endHour, 10);
    var endMin = endTime.substring(x + 1, x + 3);
    endMin = parseInt(endMin, 10); // may cause display issues

    // create start and end date moments 
    var startYear = date.year();
    var startMonth = date.month();
    var startDay = date.date();
    var startDate = moment().year(startYear).month(startMonth).date(startDay).hour(startHour).minute(startMin);
    var endYear = date.year();
    var endMonth = date.month();
    var endDay = date.date();
    var endDate = moment().year(endYear).month(endMonth).date(endDay).hour(endHour).minute(endMin);

    if (startDate > endDate) {
     alert('Invaild Date');
    } else {
        event_object = $(externalEvent).data('event');
        if ($("#txtEventDescription").val() > 0) {
            event_object.description = $('#txtExternalEventDescription').val();
        } else {
            event_object.description = '';
        }
        event_object.title = $('#txtExternalEventTitle').val();
        copiedEventObject = $.extend({}, event_object);
        copiedEventObject.start = startDate;
        copiedEventObject.end = endDate;

        if (document.getElementById("ckAllDay").checked) {
            copiedEventObject.allDay = true;
        } else {
            copiedEventObject.allDay = false;
        }
        if ($("#txtLocation").val() > 0) {
            copiedEventObject.placeID = place.formatted_address;
        } else {
            copiedEventObject.placeID = null;
        }
        copiedEventObject.category = event_object.category;
        copiedEventObject.description = event_object.description;
        console.log(startDate);
        console.log(date);
        console.log(copiedEventObject.start.toString());
        updateEvent(copiedEventObject);
        // convert dates back to local time to render on cal
        copiedEventObject.start = copiedEventObject.start.local();
        copiedEventObject.end = copiedEventObject.end.local();
        // update this method to properly render events plz
        // externalEvent.remove();
        $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);
        place = "";
    }
}

// used to update an existing date in the calendar
function showEventClickedPopUp(event) {
    $("#eventForm").dialog({
        autoOpen: false,
        height: 400,
        width: 375,
        title: 'Update Event',
        modal: true,
        buttons: {
            "Update Event": function() {
                // copy values from the clicked event to the new event
                var copiedEvent = {};
                var e = document.getElementById("ddlEventCategory");
                var category = e.options[e.selectedIndex].value;
                copiedEvent.category = category;
                copiedEvent.id = event.id;
                copiedEvent.title = $("#eventForm #txtEventTitle").val();
                // copiedEvent.start = moment(new Date($("#eventForm #txtEventStartDate").val()));
                // copiedEvent.end = moment(new Date($("#eventForm #txtEventEndDate").val()));
                copiedEvent.start = moment(new Date($("#eventForm #txtEventStartDate").data('timeAutocomplete').getTime()));
                copiedEvent.end = moment(new Date($("#eventForm #txtEventEndDate").data('timeAutocomplete').getTime()));
                copiedEvent.description = $("#eventForm #txtEventDescription").val();
                copiedEvent.placeID = place.formatted_address;
                updateEvent(copiedEvent);
                $('#calendar').fullCalendar('removeEvents', event.id);
                $('#calendar').fullCalendar('renderEvent', copiedEvent, false);
                clearTextBoxes();
            },
            Cancel: function() {
                $("#eventForm").dialog('close');
            }
        },
        close: function() {
            $("#eventPopUpForm")[0].reset();
        }
    });

    $("#eventForm #txtEventTitle").val();
    $("#eventForm").find("#btnAddEvent").click(function(e) {
        e.preventDefault();
        updateEvent(event);
    });
    populateCategoryDropDown();
    $('#ddlEventTopic').val(event.topic);
    autoComplete = new google.maps.places.Autocomplete((document.getElementById('txtEventLocation')), {
        types: ['geocode']
    });
    autoComplete.addListener('place_changed', savePlaceID);
    $("#eventForm #txtEventDescription").val(event.description);
    $("#eventForm #txtEventTitle").val(event.title);
    $("#eventForm #txtEventDate").val(event.start.format("MM-DD-YYYY"));
    $("#eventForm #txtEventStart").timeAutocomplete({
        formatter: getTimeFormatPrefence(),
        increment: 5,
        value: event.start.format('HH:mm:ss')
    });
    $("#eventForm #txtEventEndTime").timeAutocomplete({
        formatter: getTimeFormatPrefence(),
        increment: 5,
        from_selector: '#eventForm #txtEventStartTime',
        value: event.end.format('HH:mm:ss')
    });

    // $("#eventForm #txtEventStartDate").val(event.start.format('YYYY-MM-DD h:mm:ss'));
    // $("#eventForm #txtEventEndDate").val(event.end.format('YYYY-MM-DD h:mm:ss'));
    $("#eventForm").dialog('open');
}

// called when a user clicks on an empty space on the calendar
function showPopUp(start, end) {
    $("#eventForm").dialog({
        autoOpen: false,
        height: 375,
        width: 400,
        title: "Add New Event",
        modal: true,
        buttons: {
            "Add Event": function() {
                addEventFromDialog(start);
                clearTextBoxes();
            },
            Cancel: function() {
                $("#eventForm").dialog('close');
            }
        },
        close: function() {
            $("#eventPopUpForm")[0].reset();
        }
    });
    autoComplete = new google.maps.places.Autocomplete((document.getElementById('txtEventLocation')), {
        types: ['geocode']
    });
    autoComplete.addListener('place_changed', savePlaceID);

    $("#eventForm #txtEventTitle").val();
    $("#eventForm").find("#btnAddEvent").click(function() {
        addEventFromDialog();
    });
    $("#eventForm #txtEventStartTime").timeAutocomplete({
        formatter: getTimeFormatPrefence(),
        increment: 5,
        auto_value: true
    });
    $("#eventForm #txtEventDate").val(start.format('MM-DD-YYYY'));
    $("#eventForm #txtEventEndTime").timeAutocomplete({
        formatter: getTimeFormatPrefence(),
        increment: 5,
        from_selector: '#txtEventStartTime',
        //auto_value: true
    });
    // $("#eventForm #txtEventStartDate").val(start.format('MM-DD-YYYY h:mm'));
    // $("#eventForm #txtEventEndDate").val(start.add(1, 'h').format('MM-DD-YYYY h:mm'));
    $("#eventForm").dialog('open');
    populateCategoryDropDown();
    $('#ddlEventCategory').selectmenu();
}
// resets the textboxes
function clearTextBoxes() {
    $("#eventForm #txtEventDescription").val("");
    $("#eventForm #txtEventTitle").val("");
    $("#eventForm #txtEventStartDate").val("");
    $("#eventForm #txtEventEndDate").val("");
    $("#eventForm").dialog('close');
}
// TODO: add events to event array from dialog
// called when a time is clicked for the user to add an event.
function addEventFromDialog(start) {
    var eventToSave = {};
    var event = {};
    var category;
    var e = document.getElementById("ddlEventCategory");
    category = e.options[e.selectedIndex].value;
    // TODO: validate dates being passed in or create a different input
    var startTime = $("#eventForm #txtEventStartTime").data('timeAutocomplete').getTime();
    var i = startTime.indexOf(":");
    var startHour = startTime.substring(0, i);
    startHour = parseInt(startHour, 10);
    var startMin = startTime.substring(i + 1, i + 3);
    startMin = parseInt(startMin, 10); // may cause display issues 

    var endTime = $("#eventForm #txtEventEndTime").data('timeAutocomplete').getTime();
    var x = endTime.indexOf(":");
    var endHour = endTime.substring(0, x);
    endHour = parseInt(endHour, 10);
    var endMin = endTime.substring(x + 1, x + 3);
    endMin = parseInt(endMin, 10); // may cause display issues

    // var tempDate = moment($("#eventForm #txtEventDate").val());
    var tempDate = start;
    var tempMoment = moment(tempDate);
    var startYear = tempMoment.year();
    var startMonth = tempMoment.month();
    var startDay = tempMoment.date();
    var startDate =
        moment().year(startYear).month(startMonth).date(startDay).hour(startHour).minute(startMin);
    var endYear = tempMoment.year();
    var endMonth = tempMoment.month();
    var endDay = tempMoment.date();
    var endDate =
        moment().year(endYear).month(endMonth).date(endDay).hour(endHour).minute(endMin);

    // eventToSave.eventStartDate = event.start = moment(new Date($("#eventForm #txtEventStartTime").val()));
    // eventToSave.eventEndDate = event.end = moment(new Date($("#eventForm #txtEventEndTime").val()));
    if(startDate > endDate){
        alert("Invalid Date");
        return null;
    }
    eventToSave.eventTitle = event.title = $('#txtEventTitle').val();
    eventToSave.eventStartDate = event.start = startDate;
    eventToSave.eventEndDate = event.end = endDate;
    eventToSave.eventDescription = event.description = $('#txtEventDescription').val();
    eventToSave.eventTopic = event.category = category;
    console.log(eventToSave);
    console.log(event);
    updateEvent(event);
    $('#calendar').fullCalendar('refetchEvents');
    $('#calendar').fullCalendar('renderEvent', event, true);
}

function initAutoComplete() {
    autoComplete = new google.maps.places.Autocomplete((document.getElementById('txtLocation')), {
        types: ['geocode']
    });
    autoComplete.addListener('place_changed', savePlaceID);
}

function savePlaceID() {
    place = autoComplete.getPlace();
    //console.log(place);
}

function geoLocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var geoLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            var circle = new google.maps.Circle({
                center: geoLocation,
                radius: position.coords.accuracy
            });
            autoComplete.setBounds(circle.getBounds());
        });
    }
}

function locateUser() {
    $("#txtLocation").focus(function() {
        geoLocate();
    });
}

function handleClientLoad() {
    //getUserGCal();
    //gapi.load('client:auth2', initAuth);
    var apiKey = 'AIzaSyBH1B0PDg5Ck7EXnix7u9nDpFAZcGejoVE';
    var clientID = '356319519864-gcgrmgndh4t8t77mss6i7o1laa2g67vd.apps.googleusercontent.com';
    var scopes = "https://www.googleapis.com/auth/calendar";
    gapi.client.setApiKey(apiKey);
    checkAuth(clientID, scopes);
}

// use oauth2 to authorize user requests
function checkAuth(clientID, scopes) {
    gapi.auth.authorize({
        'client_id': clientID,
        'scope': scopes,
        'immediate': true
    }, handleAuthResult);
}

function handleAuthResult(authResult) {
    // var authorizeDiv
    if (authResult && !authResult.error) {
        loadCalApi();
    } else {
        console.log(authResult);
    }
}

function loadCalApi() {
    var gEventArray = [];
    try {
        gapi.client.load('calendar', 'v3').then(function() {
            var request = gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'showDeleted': false,
            });
            console.log(request);
            // get events from google
            request.execute(function(response) {
                console.log(response);
                var events = response.items;
                if (events.length > 0) {
                    for (var i = 0; i < events.length; i++) {
                        var eventGoogle = events[i];
                        var event = {};
                        event.start = moment(eventGoogle.start.dateTime);
                        if (!eventGoogle.start.dateTime) {
                            event.start = moment(eventGoogle.start.date);
                            event.allDay = true;
                        }
                        event.end = moment(eventGoogle.end.dateTime);
                        if (!eventGoogle.end.dateTime) {
                            event.end = moment(eventGoogle.end.date);
                        }
                        event.title = eventGoogle.summary;
                        event.id = eventGoogle.id;
                        event.description = eventGoogle.description;
                        event.placeID = eventGoogle.location;
                        gEventArray.push(event);
                        //console.log(event);
                        if (i == events.length - 1) {
                            $("#calendar").fullCalendar('addEventSource', gEventArray);
                            // offline testing 
                            if (!localStorage.gEventArray) {
                                localStorage.gEventArray = gEventArray;
                            } else {
                                localStorage.gEventArray = gEventArray;
                            }
                        }
                    }
                } else {
                    console.log('no events');
                }
            });

        });

    } catch (e) {
        console.log(e);
        if (localStorage.gEventArray) {
            gEventArray = localStorage.gEventArray;
        }
    }
}

// used to get events from several of the 
// user's calendars from the options
function loadMultipleCals() {
    //var gEventArray = [];
    var gCalArray = [];
    try {
        gapi.client.load('calendar', 'v3').then(function() {
            var request = gapi.client.calendar.calendarList.list({
                //'calendarId': 'primary',
                //'showDeleted': false,
            });
            console.log(request);
            request.execute(function(response) {
                gCalArray = response.items;
            });
            // get events from google
            if (gCalArray.length > 0) {
                for (var j = 0; j < gCalArray.length; j++) {
                    getEvents(gCalArray[j]);
                }
            }
        });
    } catch (e) {
        console.log(e);
    }
}

function getEvents(calId) {
    var gEventArray = [];
    var request = gapi.client.calendar.events.list({
        'calendarId': calId.toString(),
        'showDeleted': false
    });
    request.execute(function(response) {
        console.log(response);
        var events = response.items;
        if (events.length > 0) {
            for (var i = 0; i < events.length; i++) {
                var eventGoogle = events[i];
                var event = {};
                event.start = moment(eventGoogle.start.dateTime);
                if (!eventGoogle.start.dateTime) {
                    event.start = moment(eventGoogle.start.date);
                    event.allDay = true;
                }
                event.end = moment(eventGoogle.end.dateTime);
                if (!eventGoogle.end.dateTime) {
                    event.end = moment(eventGoogle.end.date);
                }
                event.title = eventGoogle.summary;
                event.id = eventGoogle.id;
                event.description = eventGoogle.description;
                event.placeID = eventGoogle.location;
                gEventArray.push(event);
                //console.log(event);
                if (i == events.length - 1) {
                    $("#calendar").fullCalendar('addEventSource', gEventArray);
                }
            }
        } else {
            console.log('no events');
        }
    });

}

function populateCategoryDropDown() {
    for (var i = 0; i < eventTypeArray.length; i++) {
        $("#ddlEventCategory").append('<option value="' + eventTypeArray[i].category + '">' + eventTypeArray[i].category + '</option>');
    }

}

// adds timeAutoComplete to the external event 
// time text boxes
function initExternalEventTimeAutoComplete() {
    $("#txtStartTime").timeAutocomplete({
        formatter: getTimeFormatPrefence(),
        increment: 5,
        // value: event.start.format('HH:mm:ss')
    });
    $("#txtEndTime").timeAutocomplete({
        formatter: getTimeFormatPrefence(),
        increment: 5,
        from_selector: '#txtStartTime',
        // value: event.end.format('HH:mm:ss')

    });


}

function getCalIdPrefence() {
    return 'primary';
}

function getDefaultEventLength() {
    if (localStorage.userSettings) {
        var userSettings = JSON.parse(localStorage.userSettings);
        return userSettings.defaultLength;
    } else {
        return 1;
    }
}

function getTimeFormatPrefence() {
    var pref;
    if (localStorage.userSettings) {
        var userSettings = JSON.parse(localStorage.userSettings);
        pref = userSettings.timeFormat;
    }
    switch (pref) {
        case "ampm":
            $("#head").append('<script src="js/ampm.js></script>');
            return "ampm";
            // break;
        case "24hr":
            $("#head").append('<script src="js/24hr.js></script>');
            return "24hr";
            // break;
        case "french":
            $("#head").append('<script src="js/french.js></script>');
            return "french";
            // break;
        default:
            $("#head").append('<script src="js/ampm.js></script>');
            return "ampm";
    }

}

function getPastEventPref(){
    if (localStorage.userSettings) {
        var userSettings = JSON.parse(localStorage.userSettings);
        if(userSettings.pastEvents == 'n'){
            return moment().utc();
        } else {
            return false;
        }
        
    }
}
