"use strict";
$(document).ready(function() {
    // getUserGCal();
    //loadEvents();
    //initAutoComplete();
    // window.eventArray = [];
    initDroppables();
    console.log(eventTypeArray);
    loadEvents();
    loadEventTypes();
    displayCalendar();
});
var numOfEvents;
// window.eventArray = [];
// var access_token;
var eventArray = [];
var eventTypeArray = [];
var value;
// var maxEventID;
var placeSearch, autoComplete, place;

// function initEventArray(global){

// }

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
        lazyFetching: false,
        forceEventDuration: true,
        eventTextColor: 'White',
        // events: $.map(eventArray, function(item, i) {
        //     console.log(item);
        //     var event = {};
        //     event.id = item.eventID;
        //     event.start = moment(item.eventStartDate);
        //     event.end = moment(item.eventEndDate);
        //     event.title = item.eventTitle;
        //     event.description = item.eventDescription;
        //     event.placeID = item.eventPlaceID;
        //     event.topic = item.eventTopic;
        //     event.allDay = item.eventAllDay;
        //     console.log(event);
        //     return event;
        // }),
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
            injectEventCategoryCSS(event, element);
            // TODO: update this
            // switch (event.topic) {
            //     case 'MC':
            //         element.addClass('MC');
            //         break;
            //     case 'B-Boy':
            //         element.addClass('B-Boy');
            //         break;
            //     case 'DJ':
            //         element.addClass('DJ');
            //         break;
            //     case 'Graffiti':
            //         element.addClass('Graffiti');
            //         break;
            //     case 'General':
            //         element.addClass('General');
            //         break;
            //     case 'Community Service':
            //         element.addClass('Community-Service');
            //         break;
            //     default:
            //         element.addClass('General');
            //         break;
            // }
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
        eventClick: function(event) {
            showEventClickedPopUp(event);
        },
        eventDestroy: function(event, element, view) {
            element.qtip('destroy');
        },
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
    // try {
    //     eventArray = JSON.parse(localStorage.getItem('eventArray'));
    // } catch (e) {
    //     return false;
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
    }
    // try {
    //     eventTypeArray = JSON.parse(localStorage.getItem('eventTypeArray'));
    // } catch (e) {
    //     //localStorage.setItem('eventTypeArray', JSON.stringify(eventTypeArray));
    //     return false;
    // }
}

// function displayEvents(eventArray) {

// }
// saves event to eventArray 
// used for both intial save and 
// later edits to the event
function updateEvent(event) {
    var desc;
    var location;
    var eventToSave = {};
    if (event.placeID) {
        location = event.placeID; // formatted address 
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
                'date': event.start.format("yyyy-mm-dd")
            },
            'end': {
                'date': event.end.format("yyyy-mm-dd")
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
            //help: "clone",
            drop: function() {
                $("#calendar").fullCalendar('unselect');
            },
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
        height: 200,
        width: 200,
        title: 'Create New Event Type',
        modal: true,
        buttons: {
            "Create": function() {
                var eventConfig = {};
                eventConfig.category = $("#txtEventCategory").val();
                eventConfig.color = '#' + value;
                createExternalEvent(eventConfig);
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

function createExternalEvent(eventConfig) {
    $("head").append('<style type="text/css"> .' + eventConfig.category + '{background-color:' + eventConfig.color + '; </style>');
    $("#external-events").append(
        '<div id="' + eventConfig.category + '" class="fc-event ' + eventConfig.category + '">' + eventConfig.category + '</div>');
    initDroppables();
}

function injectEventCategoryCSS(event, element){
    console.log('test CSSSSSSS');
    var category;
    for (var i = 0; i < eventArray.length; i++) {
        if (eventArray[i].id == event.id) {
            category = eventArray[i].category;
            break;
        }
    }
    if (category) {
        for (var i = 0; i < eventTypeArray.length; i++) {
            if (eventTypeArray[i].category == category) {
                element.css("background-color", eventTypeArray[i].color);
                break;
            }
        }
    }
    // $("head").append('<style type="text/css"> .' + eventConfig.category + '{background-color:' + eventConfig.color + '; </style>');
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

    var i = $("#ddlStartTime").val().indexOf(":");
    var startHour = $("#ddlStartTime").val().substring(0, i);
    startHour = parseInt(startHour, 10);
    var startMin = $("#ddlStartTime").val().substring(i + 1, i + 3);
    startMin = parseInt(startMin, 10); // may cause display issues 
    var e = document.getElementById('startAmPm');
    var startAmPM = e.options[e.selectedIndex].value;

    var x = $("#ddlEndTime").val().indexOf(":");
    var endHour = $("#ddlEndTime").val().substring(0, x);
    endHour = parseInt(endHour, 10);
    var endMin = $("#ddlEndTime").val().substring(x + 1, x + 3);
    endMin = parseInt(endMin, 10); // may cause display issues
    var ex = document.getElementById('endAmPm');
    var endAmPM = ex.options[ex.selectedIndex].value;

    if (startAmPM == "pm") {
        startHour += 12;
    }
    if (endAmPM == "pm") {
        endHour += 12;
    }

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
        $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);
        place = "";
    }
}

// used to update an existing date in the calendar
function showEventClickedPopUp(event) {
    $("#eventForm").dialog({
        autoOpen: false,
        height: 400,
        width: 270,
        title: 'Update Event',
        modal: true,
        buttons: {
            "Update Event": function() {
                // copy values from the clicked event to the new event
                var copiedEvent = {};
                var e = document.getElementById("ddlEventTopic");
                var topic = e.options[e.selectedIndex].value;
                copiedEvent.topic = topic;
                copiedEvent.id = event.id;
                copiedEvent.title = $("#eventForm #txtEventTitle").val();
                copiedEvent.start = moment(new Date($("#eventForm #txtEventStartDate").val()));
                copiedEvent.end = moment(new Date($("#eventForm #txtEventEndDate").val()));
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
    $('#ddlEventTopic').val(event.topic);
    autoComplete = new google.maps.places.Autocomplete((document.getElementById('txtEventLocation')), {
        types: ['geocode']
    });
    autoComplete.addListener('place_changed', savePlaceID);
    $("#eventForm #txtEventDescription").val(event.description);
    $("#eventForm #txtEventTitle").val(event.title);
    $("#eventForm #txtEventStartDate").val(event.start.format('YYYY-MM-DD h:mm:ss'));
    $("#eventForm #txtEventEndDate").val(event.end.format('YYYY-MM-DD h:mm:ss'));
    $("#eventForm").dialog('open');
}

// called when a user clicks on an empty space on the calendar
function showPopUp(start, end) {
    $("#eventForm").dialog({
        autoOpen: false,
        height: 400,
        width: 250,
        title: "Add New Event",
        modal: true,
        buttons: {
            "Add Event": function() {
                addEventFromDialog();
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
    $("#eventForm #txtEventStartDate").val(start.format('MM-DD-YYYY h:mm'));
    $("#eventForm #txtEventEndDate").val(start.add(1, 'h').format('MM-DD-YYYY h:mm'));
    $("#eventForm").dialog('open');
    $('#ddlEventTopic').selectmenu();
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
function addEventFromDialog() {
    var eventToSave = {};
    var event = {};
    var topic;
    var e = document.getElementById("ddlEventTopic");
    topic = e.options[e.selectedIndex].value;
    eventToSave.eventTitle = event.title = $('#txtEventTitle').val();
    eventToSave.eventStartDate = event.start = moment(new Date($("#eventForm #txtEventStartDate").val()));
    eventToSave.eventEndDate = event.end = moment(new Date($("#eventForm #txtEventEndDate").val()));
    eventToSave.eventDescription = event.description = $('#txtEventDescription').val();
    eventToSave.eventTopic = event.topic = topic;
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
    var view = $("#calendar").fullCalendar('getView');
    //var gEventArray = [];
    var gEventArray = [];
    // if (!eventArray) {
    //     eventArray = [];
    // }
    //var startDate = view.start.toISOString();
    // window.eventArray = [];
    console.log(view.start.local().toISOString());
    gapi.client.load('calendar', 'v3').then(function() {
        var request = gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'showDeleted': false,
            //'timeMin': view.start.toISOString()
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
                        //console.log('start test');
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

    });
    // get events from google
    // request.execute(function(response) {
    //     console.log(response);
    //     var events = response.items;
    //     if (events.length > 0) {
    //         for (var i = 0; i < events.length; i++) {
    //             var event = events[i];
    //             var copiedEvent = {};
    //             copiedEvent.eventStartDate = moment(event.start.dateTime);
    //             if (!event.start.dateTime) {
    //                 console.log('start test');
    //                 copiedEvent.eventStartDate = moment(event.start.date);
    //                 copiedEvent.eventAllDay = true;
    //             }
    //             copiedEvent.eventEndDate = moment(event.end.dateTime);
    //             if (!event.end.dateTime) {
    //                 copiedEvent.eventEndDate = moment(event.end.date);
    //             }
    //             copiedEvent.eventTitle = event.summary;
    //             copiedEvent.eventID = event.id;
    //             copiedEvent.eventDescription = event.description;
    //             copiedEvent.eventPlaceID = event.location;

    //             gEventArray.push(copiedEvent);
    //             console.log(event.start);

    //             console.log(copiedEvent);
    //         }
    //         if (i == events.length) {
    //             console.log('hi');
    //             var jsonArray = JSON.stringify(gEventArray);
    //             console.log(jsonArray);
    //             $("#calendar").fullCalendar('addEventSource', jsonArray);
    //             $("#calendar").fullCalendar('rerenderEvents');
    //         }
    //     } else {
    //         console.log('no events');
    //     }
    // });

    //});
    //initDroppables();
    //displayCalendar();
    //console.log('test');
    // var view = $('#calendar').fullCalendar('getView');
    // alert("The view's title is " + view.start.toISOString());
    // var jsonArray = JSON.stringify(gEventArray);
    // $("#calendar").fullCalendar('addEventSource', jsonArray);
    //console.log(jsonArray);
    //eventArray.push.apply(eventArray, gEventArray);
    //$("#calendar").fullCalendar('refetchEvents');

    // $("#calendar").fullCalendar({
    //     events: $.map(gEventArray, function(item, i) {
    //         var event = {};
    //         event.id = item.eventID;
    //         event.start = moment(item.eventStartDate);
    //         event.end = moment(item.eventEndDate);
    //         event.title = item.eventTitle;
    //         event.description = item.eventDescription;
    //         event.placeID = item.eventPlaceID;
    //         event.topic = item.eventTopic;
    //         event.allDay = item.eventAllDay;
    //         return event;
    //     })
    // });
}

function getCalIdPrefence() {
    return 'primary';
}