/** Settings Functions
 * @namespace
 * @class
 */
v1river.settings = {} 

/* Executes persist on click of save button 
 */
v1river.settings.savePrefsFromUI = function() {
			v1river.prefs.path= $("#baseUrl").val();
			v1river.prefs.username=$("#username").val();
			v1river.prefs.password = $("#password").val();
			v1river.prefs.showUnattachedChangeSets = $("#showUnattachedChangesets").is(':checked');
			v1river.prefs.notifications = $("#prefs_notify").is(':checked');
			v1river.prefs.refreshRate = 1000 * 60 * 5;
			v1river.settings.savePrefs();
			
			//alert('prefs saved');
			//v1river.reinit();
			//TODO Consolidate with setProject
			//$("#content").html("");
			$("#projectName").html(v1river.prefs.scope);
			//v1river.fetcher.start();
}

/** LoadSaveData = Load Saved Data 
 */
v1river.settings.dbReady = function() {
	v1river.db.LoadSaveData(v1river.settings.loadPrefs);
	
}


/** Called upon load to recall the prefs.
 * If no prefs, user is directed to prefs page.
 */
 v1river.settings.loadPrefs = function() {
	
	try {
		v1river.prefs =$.evalJSON( v1river.db.data["profile"] );
		$("#baseUrl").val(v1river.prefs.path);
		$("#username").val(v1river.prefs.username);
		$("#password").val(v1river.prefs.password); 
		v1river.ui.getProjects();
		// Set up defaults
		if(v1river.prefs.showUnattachedChangeSets == 'undefined' || typeof v1river.prefs.showUnattachedChangeSets == 'undefined') {
			v1river.prefs.showUnattachedChangeSets = false;
			
		}
		if(typeof v1river.prefs.notifications == 'undefined' || v1river.prefs.notifications == 'undefined' ) {
			v1river.prefs.notifications = true;
			
		}
		if(typeof v1river.prefs.projectname == 'undefined' || v1river.prefs.projectname == 'undefined' ) {
			v1river.prefs.projectname = '';
		} else {
			v1river.prefs.projectname  = v1river.prefs.projectname;
		}
		if(v1river.prefs.refreshRate == 'undefined' || typeof v1river.prefs.refreshRate == 'undefined') {
			v1river.prefs.refreshRate = 9000;
		} 
		// On launch, this function does the first fetch
		// Subsquent runs use the tab selection event
		/*if(!v1river.fetchCount  && !v1river.pending) {
			
		}*/
		if(debugMode) console.log("--- Initialized Prefs ---\n --- Starting Fetch ---");
		v1river.reinit();
		v1river.fetcher.start();
	
	} catch(err) {
		//alert("Please set up your preferences");
		v1river.prefs = {};
		$('#tabs').tabs('select',2);
	}
}

// Run db.SavePref
// If first auth or change of auth, fetch projects
v1river.settings.savePrefs = function() {
	var dirtyAuth = false;
	if($("#username").val() != v1river.prefs.username ||  $("#password").val() != v1river.prefs.password ) {
		dirtyAuth = true;
		
	}
	v1river.db.SavePref("profile", $.toJSON(v1river.prefs));
	
	if($("#projects-menu li").length <= 1 || dirtyAuth) {
		v1river.ui.getProjects();
		v1river.prefs.projectname = '';
	}
	

}

/** Called from UI to set the project
 * @param {string} projectname Project name for where clause.
 */

v1river.settings.setProject= function(projectname) {
	 v1river.prefs.projectname = projectname;
	 $("#projectName").html(projectname);
	 v1river.settings.savePrefsFromUI();
	 v1river.reinit();
 }
 