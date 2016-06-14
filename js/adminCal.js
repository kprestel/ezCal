$(document).ready(function() {
    intDroppables();
    displayCalendar();
});
var maxEventID;
var placeSearch, autoComplete, place;

function displayCalendar() {
    $.ajax({
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data: "{}",
        url: "/calendarFeed.php",
        dataType: "json",
        success: function(data) {
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
                events: $.map(data.d, function(item, i) {
                    console.log(item);
                    var event = new Object();
                    event.id = item.eventID;
                    event.start = moment(item.eventStartDate);
                    event.end = moment(item.eventEndDate);
                    event.title = item.eventTitle;
                    event.description = item.eventDescription;
                    event.placeID = item.eventPlaceID;
                    event.topic = item.eventTopic;
                    event.allDay = false;
                    return event;
                }),
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
                eventAfterAllRender: function(view) {
                },
                drop: function(date) {
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
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    debugger;
                }
            });
        }
    });
}

function updateEvent(event) {
    var eventToSave = new Object();
    eventToSave.eventID = event.id;
    eventToSave.eventTitle = event.title;
    eventToSave.eventStartDate = event.start.format('YYYY-MM-DD h:mm:ss');
    eventToSave.eventEndDate = event.end.format('YYYY-MM-DD h:mm:ss');
    eventToSave.eventTopic = event.topic,
    eventToSave.eventPlaceID = event.placeID;
    eventToSave.eventDescription = event.description;
    console.log(eventToSave);
    $.ajax({
        type: "POST",
        contentType: "application/json",
        data: "{eventData:" + JSON.stringify(eventToSave) + "}",
        url: "/CalendarService.asmx/updateEvent",
        dataType: "json",
        success: function() {
            $('#calendar').fullCalendar('refetchEvents');
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            debugger;
        }
    });
}
// adds drag/drop functionality the events
function intDroppables() {
    $('#external-events .fc-event').each(function() {
        $(this).data('event', {
            topic: $(this).text(),
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
}

function intExternalEvents() { // not used?
    var clonedEvent = $('#external-events .fc-event').clone();
    var eventDescription = $('#txtExternalEventDescription').val();
    var eventTitle = $('#txtExternalEventTitle').val();
    $(clonedEvent).attr('data-description', eventDescription);
    $(clonedEvent).attr('data-title', eventTitle);
}
// deletes event from the DB when it is dropped in the trashcan
function deleteEvent(event) {
    eventToDelete = new Object();
    eventToDelete.eventID = event.id;
    $.ajax({
        type: "POST",
        contentType: "application/json",
        data: "{eventData:" + JSON.stringify(eventToDelete) + "}",
        url: "/CalendarService.asmx/deleteEvent",
        dataType: "json",
        success: function() {
            $('#calendar').fullCalendar('removeEvents', event.id);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            debugger;
        }
    });
}
// called when an existing event's date/time is changed by being dropped on the calendar
function eventDropped(date, externalEvent) {
    var event_object;
    var copiedEventObject;
    var duration = 60;
    var newId = getNewID();
    var endDate = date.clone().add(1, 'h');
    event_object = $(externalEvent).data('event');
    event_object.description = $('#txtExternalEventDescription').val();
    event_object.title = $('#txtExternalEventTitle').val();
    copiedEventObject = $.extend({}, event_object);
    copiedEventObject.start = date;
    copiedEventObject.id = maxEventID.eventID;
    copiedEventObject.end = endDate;
    copiedEventObject.allDay = false;
    copiedEventObject.placeID = place.place_id;
    copiedEventObject.topic = event_object.topic;
    copiedEventObject.description = event_object.description;
    console.log(copiedEventObject);
    updateEvent(copiedEventObject);
    $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);
    place = "";
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
                var copiedEvent = new Object();
                var e = document.getElementById("ddlEventTopic");
                topic = e.options[e.selectedIndex].value;
                copiedEvent.topic = topic;
                copiedEvent.id = event.id;
                copiedEvent.title = $("#eventForm #txtEventTitle").val();
                copiedEvent.start = moment(new Date($("#eventForm #txtEventStartDate").val()));
                copiedEvent.end = moment(new Date($("#eventForm #txtEventEndDate").val()));
                copiedEvent.description = $("#eventForm #txtEventDescription").val();
                copiedEvent.placeID = place.place_id;
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

function showDroppedEventPopUp(event) { // currently not used 3/30
    $("#eventForm").dialog({
        autoOpen: false,
        height: 400,
        width: 270,
        modal: true,
    });
    $("#txtEventTitle").val(event.title);
    $("txtEventStartDate").val(event.start);
    $("txtEventEndDate").val(event.end);
    $("eventForm").dialog('open');
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
// get next availiable ID to assign it to the event in fullcalendar
function getNewID() {
    //$.getJSON("/CalendarService.asmx/getMaxEventID", function (data) {
    //    var maxEventID = data.d[0];
    //    return maxEventID;
    //});
    $.ajax({
        url: "/CalendarService.asmx/getMaxEventID",
        type: "POST",
        async: false,
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function(data) {
            console.log(data.d);
            maxEventID = data.d[0];
            //return maxEventID;
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            debugger;
        }
    })
}
// called when a time is clicked for the user to add an event.
function addEventFromDialog() {
    var eventToSave = new Object();
    var event = new Object();
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

    $.ajax({
        type: "POST",
        contentType: "application/json",
        data: "{eventData:" + JSON.stringify(eventToSave) + "}",
        url: "/CalendarService.asmx/updateEvent",
        dataType: "json",
        success: function() {
            $("#eventForm").reset();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            debugger;
        }
    });
}

function updateEventSource(data) { // delete?
    var events = new Array();
    $.map(data.d, function(item, i) {
        console.log(item);
        var eventEndDate = new Object();
        var event = new Object();
        event.id = item.eventID,
        event.start = new Date(item.eventStartDate),
        event.end = new Date(item.eventEndDate),
        event.title = item.eventTitle,
        event.description = item.eventDescription,
        event.topic = item.eventTopic,
        event.allDay = false;
        events.push(event);
        console.log(event);
    });
    $('#calendar').fullCalendar('addEventSource', events);
}

function initAutoComplete() {
    autoComplete = new google.maps.places.Autocomplete((document.getElementById('txtLocation')), {
        types: ['geocode']
    });
    autoComplete.addListener('place_changed', savePlaceID);
}

function savePlaceID() {
    place = autoComplete.getPlace();
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

function onSuccess(response) {
    return response.d;
}

function onError(response) {
    console.log(Error);
}