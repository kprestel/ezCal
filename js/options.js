"use strict";
$(document).ready(function() {
	$("#btnSave").click(function() {
		saveOptions();
	});
	$("#ddlTimeFormat").selectmenu();
	// $("#ddlTimeFormat").selectmenu("enable");
	$("#ddlReminders").selectmenu();
	// $("#ddlReminders").selectmenu("enable");
	// $("#ddlMultiCal").selectmenu("enable");
	$("#ddlMultiCal").selectmenu();
	// $("#ddlDefaultLength").selectmenu("enable");
	$("#ddlDefaultLength").selectmenu();
	// $("#ddlPastEvents").selectmenu("enable");
	$("#ddlPastEvents").selectmenu();
	console.log('asdfasdfasdfasd');
	loadOptions();
});

// var settings = {};
var bgValue;
var txtValue;

function saveOptions() {
	var settings = {};
	var tf = $("#ddlTimeFormat");
	var tf = document.getElementById("ddlTimeFormat");
	settings.timeFormat = tf.options[tf.selectedIndex].value;
	var r = document.getElementById("ddlReminders");
	settings.reminders = r.options[r.selectedIndex].value;
	var mc = document.getElementById("ddlMultiCal");
	settings.multiCal = mc.options[mc.selectedIndex].value;
	var dl = document.getElementById("ddlDefaultLength");
	settings.defaultLength = dl.options[dl.selectedIndex].value;
	var pe = document.getElementById("ddlPastEvents");
	settings.pastEvents = pe.options[pe.selectedIndex].value;
	settings.bgColor = bgValue;
	settings.txtColor = txtValue;
	console.log(settings);
	storeOptions(settings);
}

function storeOptions(settings) {
	// localStorage.setItem('userSettings', JSON.stringify(settings));
	var userSettings = JSON.stringify(settings);
	console.log(userSettings);
	var key = "settings";
	var jsonSettings = {};
	jsonSettings[key] = userSettings;
	console.log(jsonSettings);
	chrome.storage.sync.set(jsonSettings, function(){
		console.log('settings', key, userSettings);
	});
} 
function loadOptions() {
	if (localStorage.userSettings) {
		var userSettings = JSON.parse(localStorage.userSettings);
		$("#ddlTimeFormat").val(userSettings.timeFormat);
		$("#ddlTimeFormat").selectmenu('refresh');
		$("#ddlReminders").val(userSettings.reminders);
		$("#ddlReminders").selectmenu('refresh');
		$("#ddlMultiCal").val(userSettings.multiCal);
		$("#ddlMultiCal").selectmenu('refresh');
		$("#ddlDefaultLength").val(userSettings.defaultLength);
		$("#ddlDefaultLength").selectmenu('refresh');
		$("#ddlPastEvents").val(userSettings.pastEvents);
		$("#ddlPastEvents").selectmenu('refresh');
		$("#bgColor").css("color", userSettings.bgColor);
		$("#txtColor").css("color", userSettings.txtColor);
	}
}

function setBgColor(picker) {
	var jsColor = picker;
	bgValue = jsColor.toString();
	return bgValue;
}

function setTxtColor(picker) {
	var jsColor = picker;
	txtValue = jsColor.toString();
	return txtValue;
}
