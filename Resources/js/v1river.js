


/** Initializatoin
 * Set up tabs
 * Init TAFFY db
 * Init Superfish Menu
 * Titanium Connectivity Listener (not functional in Windows @ Titanium v0.6)
 **/

$(document).ready(function() {
	
	// Set up prefs	
	if(!v1river.db) {
		 v1river.db = new MagicPrefs("v1river", v1river.settings.dbReady);		 
	}
	// Setup UI from Prefs						   
	$("#baseUrl").val(v1river.prefs.path);
	$("#username").val(v1river.prefs.username);
	$("#password").val(v1river.prefs.password);						   
	
	// Set up news database
	v1river.itemdb = new TAFFY([]);
	v1river.itemdb.onInsert =  function (r) {
		v1river.ui.toaster(r);
		v1river.ui.publish(r);
	};
	
	
	// initialise plugins
	jQuery(function(){
		jQuery('ul.sf-menu').superfish();
	});


	$('#tabs').tabs()
	$('#tabs').bind('tabsselect', function(event, ui) {
		if($(ui.tab).attr("id") == 't2') {
			// my
			v1river.outputElement="mycontent";
	 		v1river.reinit();
			v1river.mode = 'my';// = "Owners.IsSelf='TRUE'|ChangedBy.IsSelf='TRUE'";
			v1river.fetcher.start();
			return true;
		}
		if($(ui.tab).attr("id") == 't1') {
			
			v1river.outputElement="content";
	 		v1river.reinit();
			v1river.mode = ''; //customWhere = "";
			v1river.fetcher.start();
			return true;
		}
		/* Future home of stats
		if($(ui.tab).attr("id") == 't4') {
			
			v1river.viz();
		}*/
							   
	});
	// Style & Position for Header
	$("#header").css("width", parseInt($("#tabs").innerWidth()) - 320);
	
	$("#tabs").removeClass("ui-corner-all");
	$("#tabs ul").removeClass("ui-corner-all");
	
	$("#tabs").addClass("ui-corner-top");
	$("#tabs ul").addClass("ui-corner-top");
	
	//$("#tabs").addClass("ui-corners-top");
	if(v1river.platform == 'titanium-desktop' && !v1river.state.trayed) {
	
		v1river.titanium.createTray();
		v1river.state.trayed = true;
		v1river.networkListener = Titanium.Network.addConnectivityListener(function() {
			//console.log(evt);
			v1river.state.network = Titanium.Network.online;
			if(debugMode) console.log("ONLINE / OFFLINE " + v1river.state.network);
		});
					
	}		
	
});


var debugMode = true;

/* Namespace for application
 * @namespace
 */
var v1river = {
	count:20,
	db: false,
	fetchRun: 0,
	fetchTimer: false,

	items: [],
	itemdb: false,
	lastToast: false, // Track Max Moment of Toast
	lastFetch: false,
	
	unread: 0,
	platform: 'titanium-desktop', // Flag for platform
	state : {
		network: true,
		trayed: false,
		minMoment: false,
		refreshRate: 1000 * 60 * 4,
	},
	defaultRefreshRate: 1000 * 60 * 4,
	lastUpdate: false,
	statusTimer: false,
	networkListener: false, // Online / offline detector, not working on Windows 

	maxNodes: 120,
	mode: '', 
	outputElement: "content",
	prefs : {
		notifications: true,
		showUnattachedChangesets: false,
		showChangesets: true,
		username: '',
		password: '',
		path: '',
		projectname: '',
		types: 'Workitem,ChangeSet',	
		refreshRate: 90000
	},
	pending: 0,
 };
 
 

v1river.getMaxMoment = function() {
	return $("#" + v1river.outputElement).parent().attr("data:moment");
}


// Takes a node and inserts it by Moment ordering 
v1river.insertNew = function(node) {
	var root =  $("#" + v1river.outputElement);
	var nodes = root.find(".news-item");
	if(nodes.length) {
		var curMoment = node.getAttribute("moment");
		var offset = 0;
		while (nodes.length && offset < nodes.length-1 && typeof nodes[offset] != 'undefined' && curMoment < nodes[offset].getAttribute("moment") ) {
			offset++;			
		}
	if(debugMode) console.log("New " + curMoment + " vs " + nodes[offset].getAttribute("moment"))
	if(offset+1 <nodes.length ) {
			$(nodes[offset]).before(node).show()	;
		} else {
			$(nodes[offset]).after(node).show()	;
		}
	} else {
		root.append(node);	
	}
	
}

 v1river.reinit = function() {
	 v1river.items = [];
	 v1river.lastUpdate = false;
	 v1river.lastFetch = false;
	 v1river.fetchCount = 0;
	 $("#content").parent().attr("data:moment", 0);
	 $("#mycontent").parent().attr("data:moment", 0);
	 $("#content").html("");
	 $("#mycontent").html("");
	 window.clearInterval(v1river.fetchTimer);
	 window.clearInterval(v1river.statusTimer);	 
	 if(debugMode) console.log("Reinited with fetchTimer " + v1river.fetchTimer);
	 v1river.fetchTimer = false;
	 v1river.statusTimer = false;

 }
 
	
v1river.monitor = function (xmlRequest, status) {
	if(debugMode) console.log("Setting up monitor " + v1river.fetchTimer);
	if(!v1river.fetchTimer) {
		v1river.fetchTimer = window.setInterval(v1river.fetcher.start, 1000*60*3);//v1river.refreshRate);
		v1river.statusTimer = window.setInterval(v1river.ui.refreshTimes, 1000*60); //30000);
	}
}



