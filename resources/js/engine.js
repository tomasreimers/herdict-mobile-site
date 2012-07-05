// *******************
// *** reporter ******
// *******************

// Load field options
var toLoad = ["categories", "countries", "locations", "interests", "reasons"];
var locationData = {
	countryShort:undefined,
	ipTo:undefined,
	countryLong:undefined,
	ipFrom:undefined,
	ispName:undefined
};

// gets translation data
function updateLocationData(){
	$.ajax({
		// TODO: Add IP Get var or something because right now it returns our server's location data
		url: 'ajax/request/currentLocation',
		success: function (data, status, jqxhr){
			// parse data
			var clean = cleanJSON(jqxhr.responseText);
			locationData = $.parseJSON(clean);
			// update fields
			$("#ispField")[0].value = locationData.ispName;
		}
	});
	// update later
	setTimeout(updateLocationData, 60000);
}

// key init data
$(document).ready(function (){
	updateLocationData();
	// Actually put data into select fields when open page
	// TODO: If you start on #report, this will never fire
	$("#report").one("pageinit", loadOtherFields);
});

// load the other (non-isp and non-country) fields
function loadOtherFields(){
	// init fields
	for (var i = 0; i < toLoad.length; i++){
		$.ajax({
			url: 'ajax/request/'+toLoad[i],
			// test if we can access herdict, if we can use its data
			success: (function (section){
				return (function(data, status, jqxhr) {
					// actually populate field
					var fields = $.parseJSON(jqxhr.responseText);
					for (var key in fields){
						populateFields(section, fields[key]);
					}
					loadedData(section);
				});
			})(toLoad[i])
		});
	}
}

var countriesLoaded = 1; // the default "select country" option is already poulated

// actually fills in select value
function populateFields(section, obj){
	$("#"+section+"Field").append('<option value="' + obj.value + '">' + obj.label + '</option>');
	if (section == "countries"){
		countriesLoaded++;
	}
	if (obj.value == locationData.countryShort){
		$("#countriesField")[0].selectedIndex = (countriesLoaded - 1);
		$("#countriesField").selectmenu("refresh");
		$("#countriesField").trigger("change");
	}
}

var fieldsLoaded = 0;

// All data has been loaded into fields
function loadedData(sectionLoaded){
	fieldsLoaded++;
	if (fieldsLoaded == toLoad.length){
		resetAllFields();
	}
}

var sitesReported = 0;

// add site to queue
function queueUp(accessibleBoolean){
	if ($("#urlField")[0].value != ""){
		// get data
		var category = $("#categoriesField")[0].value;
		var country = $("#countriesField")[0].value;
		var location = $("#locationsField")[0].value;
		var interest = $("#interestsField")[0].value;
		var reason = $("#reasonsField")[0].value; 
		var isp = $("#ispField")[0].value;
		var url = prepareURL($("#urlField")[0].value);
		var accessible = (accessibleBoolean ? 1 : 0);
		var comment = $("#commentField")[0].value;
		// report
		// TODO: add report.sourceID
		var sourceId = "1";
		// TODO: Replace dev2 with www
		var reportRequest = "ajax/report?" + (accessibleBoolean ? "siteAccessible" : "siteInaccessible") + "&report.url=" + encodeURIComponent(url) + "&report.country.shortName=" + encodeURIComponent(country) + "&report.ispName=" + encodeURIComponent(isp) + "&report.location=" + encodeURIComponent(location) + "&report.interest=" + encodeURIComponent(interest) + "&report.reason=" + encodeURIComponent(reason) + "&report.tag=" + encodeURIComponent(category) + "&report.comments=" + encodeURIComponent(comment) + "&defaultCountryCode=" + encodeURIComponent(locationData.countryShort) + "&defaultISPName=" + encodeURIComponent(locationData.ispName) + "&report.sourceId=" + sourceId + "&encoding=ROT13"; 
		$.ajax({
			url: reportRequest
		});
		// thank
		if (!randomMode){
			alert("Thanks! Your report has been recorded.");
		}
		$("#reportedContent").prepend("<div class='" + (accessible ? "" : "in") + "accessible'>" + $("#urlField")[0].value + "</div>");
		if ($("#reportedContent div").length > 4){
			$($("#reportedContent div")[4]).remove();
		}
		sitesReported++;
		$("#numberReported").html(sitesReported.toString());
		resetAllFields();
		// move on 
		loadRandomDomain();
	}
}

// cleans the report fields 
function resetAllFields(){
	$("#categoriesField option:selected").removeAttr("selected");
	$("#categoriesField").selectmenu("refresh");
	$("#interestsField option:selected").removeAttr("selected");
	$("#interestsField").selectmenu("refresh");
	$("#reasonsField option:selected").removeAttr("selected");
	$("#reasonsField").selectmenu("refresh");
	$("#urlField")[0].value = "";
	$("#commentField")[0].value = "";
	$(".accessSubmit").removeClass("ui-btn-active");
}

// functions for domain roulette
var randomMode = false;
var randomQueue;
var hideFromReporter = false;
var currentListId;

// loads next item from the queue
function loadRandomDomain(){
	// only do this if random mode enabled
	if (randomMode){
		// load queue if need be
		if (typeof(randomQueue) == 'undefined' || currentListId != listId){
			currentListId = listId;
			$.ajax({
				url: 'ajax/list/' + listId,
				success: function (data, status, jqxhr){
					randomQueue = $.parseJSON(jqxhr.responseText);
					randomQueue.reverse(); // so that the most important item is last and can easily be popped
					loadRandomDomain();
				}
			});
		}
		// already loaded, so all that needs to occur is to show site
		else {
			var randomDomain = randomQueue.pop();
			if (typeof(randomDomain) === 'undefined'){
				alert("Wow! You completed the entire " + lists[currentListId] + " list. Nice job!");
				toggleRandom();
			}
			else {
				// skip explicit sites
				if (randomDomain.adult === true){
					loadRandomDomain();
				}
				else {
					hideFromReporter = randomDomain.site.hideFromReporter;
					$("#urlField")[0].value = randomDomain.site.url;
					$("#urlField").trigger("change");
				}
			}
		}
		// TODO:possibly delete?, tries to guess category based on categorization group
		/*
		$('#categoriesField option:selected').removeAttr("selected");
		$($('#categoriesField option[value^="' + randomDomain.site.category + '"]')[0]).prop("selected", true);
		$('#categoriesField').selectmenu("refresh");
		*/
	}
}

// turn random mode on/off
function toggleRandom(){
	if (!randomMode){
		randomMode = true;
		$("#randomButton").addClass("toggledOn");
		$('#queueNotice').css('display', 'block');
		$('#queueNotice').click();
	}
	else {
		randomMode = false;
		$("#randomButton").removeClass("toggledOn");
		$('#queueNotice').css('display', 'none');
	}
}

// rot13 encode and strip any excess paths or protocols
function prepareURL(url){
	// strip http
	if (url.substr(0,7) == "http://"){
		url = url.substr(7);
	}
	// strip any trailing path, query, or hash
	var offendingCharacters = ["/", "?", "#"];
	for (var i = 0; i < offendingCharacters.length; i++){
		url = (url.split(offendingCharacters[i]))[0];
	}
	// rot13
	var lowercase = "abcdefghijklmnopqrstuvwxyz";
 	url = url.toLowerCase();
	var urlArray = url.split("");
	var lettersToIterateThru = urlArray.length;
	for (var i = 0; i < lettersToIterateThru; i++){
		var currentPosition = lowercase.indexOf(urlArray[i]);
		if (currentPosition >= 0){
			currentPosition += 13;
			currentPosition = currentPosition%26;
			urlArray[i] = lowercase[currentPosition];
		}
	}
	url = urlArray.join("");
	// that's all folks
	return url;
}
// herdict returns bad JSON, strip the excess parens
function cleanJSON(json){
	var start = 0;
	var end = json.length;
	if (json.charAt(0) == "("){
		start++;
	}
	if (json.charAt(end - 1) == ")"){
		end--;
	}
	return json.slice(start, end);
}

// when open extra-options menu, must 
function scrollToBottom(){
	$(window).scrollTop($(document).height());
}

// *******************
// *** select list ***
// *******************

var listId;

// chose a list to enable random mode with
function selectList(givenId){
	listId = givenId;
	$('#listSelect').dialog('close');
	$('#whichList').html(lists[listId]);
	loadRandomDomain();
}

var lists = new Array();

// a list of lists
function loadLists(){
	// TODO: Replace with API call when availiable
	lists[-1] = "Herdict";
	lists[2] = "EFF";
	lists[3] = "Reporters without Borders";
	lists[4] = "OpenNet Initiative";
	lists[5] = "Twitter";
	lists[6] = "Global Voices";
	doneLoadingLists();
}

// actually add lists to select menu
function doneLoadingLists(){
	for (var key in lists){
		$('#listSelectList').prepend("<li><a href='#' onclick='selectList(" + key + ")'>" + lists[key] + "</a></li>");
	}
}

// make it so not choosing a list disables random mode
$(document).ready(function (){
	loadLists();
	$("#listSelect").one("pageinit", function (){
		$('#listSelectList').listview('refresh');
		$('#listSelect div[data-role="header"] a').on('click', function (){
			toggleRandom();
		});
	});
});


// *******************
// *** walkthrough ***
// *******************

// a little bit of abstraction so that the variable skipWalkthrough is persistent
Object.defineProperty(window, "skipWalkthrough", {
	get : function(){
        if (window.localStorage.getItem("skipWalkthrough") === null){
        	window.localStorage.setItem("skipWalkthrough", "false");
        }
        return window.localStorage.getItem("skipWalkthrough");
    },  
    set : function(newValue){
    	window.localStorage.setItem("skipWalkthrough", newValue);
    },  
    enumerable : true,  
    configurable : true
});

// skips walkthrough if that is setting
$(document).on("pagebeforechange", function (e, data){
	if (typeof(data.toPage) === "object"){
		if (data.toPage.is($("#walkthrough"))){
			if (window.skipWalkthrough == "true"){
				data.toPage = "#report";
			}
		}
	}
});

// *******************
// *** viewer ********
// *******************

// checks accessibility of URL
function checkLink(){
	var currentURL = $("#urlCheckField")[0].value;
	currentURL = prepareURL(currentURL);
	$.ajax({
		url: 'ajax/site/'+currentURL+'/'+locationData.countryShort+'/ROT13/',
		success: function(data, status, jqxhr) {
			var clean = cleanJSON(jqxhr.responseText);
			var siteData = $.parseJSON(clean);
			$("#herdometer div").removeClass("activeSheep");
			$($("#herdometer div")[siteData.sheepColor]).addClass("activeSheep");
			$("#globalCount").html(siteData.globalInaccessibleCount);
			$("#localCount").html(siteData.countryInaccessibleCount);
			$(".herdometerSite").html($("#urlCheckField")[0].value);
			$("#herdometerData").css('display', 'block');
			$("#urlCheckField").blur();
		}
	});
}

// *******************
// ***** home ********
// *******************

// makes it so both home buttons occupy corrct area based on device orientation
function resizeHome(){
	// grab basics
	var availiableHeight = $(window).height();
	var availiableWidth = $(window).width();
	// subtract padding and navbar
	availiableHeight -= 30; // padding
	availiableHeight -= 42; // navbar
	availiableWidth -= 30; // padding
	// get whichever is larger 
	if (availiableHeight >= availiableWidth){
		$("#reportHomeLink, #queryHomeLink").height((availiableHeight - 10)/2);
		$("#reportHomeLink, #queryHomeLink").width(availiableWidth);
		$("#queryHomeLink").css("margin-top", "10px");
		$("#queryHomeLink").css("margin-left", "0");
	}
	else {
		$("#reportHomeLink, #queryHomeLink").width((availiableWidth - 20)/2);
		$("#reportHomeLink, #queryHomeLink").height(availiableHeight);
		$("#queryHomeLink").css("margin-left", "10px");
		$("#queryHomeLink").css("margin-top", "0");
	}
	// center content in each
	$("#reportHomeLink > span, #queryHomeLink > span").each(function (index, el){
		var newHeight = ($(el).parent().height() - 102)/2;
		$(el).css("margin-top", newHeight);
	});
}

$(window).on('resize', function (){
	resizeHome();
	// stops odd scroll bar glitch
	resizeHome();
});
$(document).one("pageshow", function (){
	resizeHome();
	// stops odd scroll bar glitch
	resizeHome();
});


// *******************
// ** GET TOP SITES **
// *******************

function getTopSites(){
	$.ajax({
		url: 'ajax/topsites/' + locationData.countryShort,
		success: function (data, status, jqxhr){
			// convert to DOM object so I can traverse it for good parts
			var DOMObj = $('<div>' + jqxhr.responseText + '</div>');
			$("#topsitesContent").html(DOMObj.children("div")[0].innerHTML);
			$("#topsitesContent").children("a").attr("href", "#");
			$("#topsitesContent").prepend("<div id='topsiteNote'>(In your country)</div>");
		},
		error: function (){
			$.mobile.changePage("#error");
		}
	});
}
$(document).ready(function (){
	$("#topsites").on("pageshow", getTopSites);
});