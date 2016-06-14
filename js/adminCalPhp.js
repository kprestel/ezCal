$(document).ready(function() {
    // var json_events;
    // $.ajax({
    //     url: '/phpScripts/calendarFeed.php',
    //     type: 'POST',
    //     //data: '{"start" : "' + start + '", "end": "' + end + '"}',
    //     contentType: 'application/json; charset=utf-8',
    //     dataType: 'json',
    //     success: function(response) {
    //         console.log(response);
    //         json_events = response;

    //     }
    // });
    // $('#calendar').fullCalendar({
    //     //events: $.parseJSON(json_events)
    //     events: json_events
    // });
    intDroppables();
    displayCalendar();
    });
    //$('#calendar').fullCalendar('rerenderEvents');

//var start = moment();
//var end = moment();
var maxEventID;
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
        lazyFetching: false,
        forceEventDuration: true,
        eventTextColor: 'White',
        events: function(start, end, timezone, callback) {
            start = $('#calendar').fullCalendar('getDate').format();
            end = $('#calendar').fullCalendar('getCalendar').moment().format();
            $.ajax({
                url: '/phpScripts/calendarFeed.php',
                type: 'POST',
                data: '{"start" : "' + start + '", "end": "' + end + '"}',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                success: function(response) {
                    var events = [];

                    console.log(response);
                    $.map(response, function(item, i) {
                        //console.log(item);
                        var event = new Object();
                        event.id = item.id;
                        event.start = moment(item.start).toISOString();
                        event.end = moment(item.end).toISOString();
                        event.title = item.title;
                        event.description = item.description;
                        event.placeID = item.placeID;
                        event.topic = item.topic;
                        event.allDay = false;
                        console.log(event);
                        events.push(event);
                        //return event;
                    });
                    callback(events);
                },
                error: function(xhr, textStatus, errorThrown) {
                    console.log(xhr.responseText);
                    debugger;
                }
            });


        },
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
            //if ($(this).data("qtip")) $(this).qtip('destroy');
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
        //disableResizing: true,
        startEditable: true,
        eventAfterAllRender: function(view) {},
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
        dragRevertDuration: 0
    });
}

var getEvents = function() {
    var events = [];
    $.ajax({
        url: '/phpScripts/calendarFeed.php',
        type: 'POST',
        data: {
            start: Math.round(start.getTime() / 1000),
            end: Math.round(end.getTime() / 1000)
        },
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function(response) {
            console.log(response);

            //$('#calendar').fullCalendar({
            $.map(response, function(item, i) {
                //console.log(item);
                var event = new Object();
                event.id = item.id;
                event.start = moment(item.start);
                event.end = moment(item.end);
                event.title = item.title;
                event.description = item.description;
                event.placeID = item.placeID;
                event.topic = item.topic;
                event.allDay = false;
                events.push(event);
                //console.log(event);
                //return event;
                //})
            });
            //callback(events);


        },
        error: function(xhr, textStatus, errorThrown) {
            console.log(xhr.responseText);
            debugger;
        }
    });
    //return events;
}

function updateEvent(event) {
    // get event's data 
    var eventID = event.id;
    var eventTitle = event.title;
    var eventStartDate = event.start.format('YYYY-MM-DD h:mm:ss');
    var eventEndDate = event.end.format('YYYY-MM-DD h:mm:ss');
    var eventTopic = event.topic;
    var eventPlaceID = event.placeID;
    var eventDescription = event.description;
    $.ajax({
        url: "/phpScripts/updateEvent.php",
        type: "POST",
        async: false,
        data: 'title=' + eventTitle + '&start=' + eventStartDate + '&end=' + eventEndDate + '&topic=' + eventTopic +
            '&placeID=' + eventPlaceID + '&description=' + eventDescription + '&id=' + eventID,
        dataType: "json",
        success: function(response) {
            console.log(response);
            //$('#calendar').fullCalendar('refetchEvents');
        },
        error: function(xhr, textStatus, errorThrown) {
            console.log(xhr.responseText);
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

// deletes event from the DB when it is dropped in the trashcan
function deleteEvent(event) {
    $.ajax({
        url: "/phpScripts/deleteEvent.php",
        type: "POST",
        data: 'eventID=' + event.id,
        async: false,
        dataType: "json",
        success: function(response) {
            console.log(response);
            $('#calendar').fullCalendar('removeEvents', event.id);
        },
        error: function(xhr, textStatus, errorThrown) {
            console.log(xhr.responseText);
            console.log(errorThrown);
            debugger;
        }
    });
}

function addNewEvent(event) {
    // get dropped event's data to add to db 
    var eventID = event.id;
    var eventTitle = event.title;
    var eventStartDate = event.start.format('YYYY-MM-DD h:mm:ss');
    var eventEndDate = event.end.format('YYYY-MM-DD h:mm:ss');
    var eventTopic = event.topic;
    var eventPlaceID = event.placeID;
    var eventDescription = event.description;
    $.ajax({
        url: "/phpScripts/insertEvent.php",
        type: "POST",
        data: 'title=' + event.title + '&start=' + eventStartDate + '&end=' + eventEndDate + '&topic=' + eventTopic +
            '&placeID=' + eventPlaceID + '&description=' + eventDescription + '&id=' + eventID,
        dataType: "json",
        success: function(response) {
            console.log(response);
            $('#calendar').fullCalendar('refetchEvents');
        },
        error: function(xhr, textStatus, errorThrown) {
            console.log(xhr.responseText);
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
    maxEventID += 1;
    var endDate = date.clone().add(1, 'h');
    event_object = $(externalEvent).data('event');
    event_object.description = $('#txtExternalEventDescription').val();
    event_object.title = $('#txtExternalEventTitle').val();
    copiedEventObject = $.extend({}, event_object);
    copiedEventObject.start = date;
    copiedEventObject.id = maxEventID;
    copiedEventObject.end = endDate;
    copiedEventObject.allDay = false;
    copiedEventObject.placeID = place.place_id;
    copiedEventObject.topic = event_object.topic;
    copiedEventObject.description = event_object.description;
    console.log(copiedEventObject);
    addNewEvent(copiedEventObject);
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
    // init autocomplete 
    autoComplete = new google.maps.places.Autocomplete((document.getElementById('txtEventLocation')), {
        types: ['geocode']
    });
    autoComplete.addListener('place_changed', savePlaceID);
    // set textboxes value based on where user clicked
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
    $.ajax({
        url: "/phpScripts/getMaxID.php",
        type: "POST",
        async: false,
        data: "{}",
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function(data) {
            console.log(data.eventID);
            //var json = $.parseJSON(data);  
            maxEventID = data.eventID;

            //maxEventID = data.d[0];
            //return maxEventID;
        },
        error: function(xhr, status, error, data) {
            console.log(data);
            console.log(xhr.responseText);
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
    var topic = e.options[e.selectedIndex].value;
    event.title = $('#txtEventTitle').val();
    event.start = moment(new Date($("#eventForm #txtEventStartDate").val()));
    event.end = moment(new Date($("#eventForm #txtEventEndDate").val()));
    event.description = $('#txtEventDescription').val();
    event.topic = topic;
    event.placeID = place;
    addNewEvent(event);
}
// google maps init call back
function initAutoComplete() {
    autoComplete = new google.maps.places.Autocomplete((document.getElementById('txtLocation')), {
        types: ['geocode']
    });
    autoComplete.addListener('place_changed', savePlaceID);
}

function savePlaceID() {
    place = autoComplete.getPlace();
    console.log(place);
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
