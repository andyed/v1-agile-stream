/** UI Rendering & State Functions
 * @namespace
 */
v1river.ui = {};

/** Populate Projects Menu
 * Called onload or auth change
 * @see savePrefs
 * @see v1river.settings.setProject
 */
v1river.ui.getProjects = function () {
    jQuery.ajax( {
      url:v1river.prefs.path + "rest-1.v1/Data/Scope?sel=Name,Parent.Name&where=AssetState!=%27Closed%27" + "&Accept=application/json",
      dataType: "json",
       beforeSend: function(xhr) {xhr.setRequestHeader("Authorization",v1river.fetcher.authHeader() );} ,		
	   error: function(xhr, ajaxOptions, thrownError) {
				if(debugMode) console.log("Status:" + xhr.status + " : " + thrownError);                                    
				v1river.ui.authFailure();				
			  },
      success: function suggestTopics( response ) {
		$("#projects-menu").html("");
		$("#projects-menu").append('<li id="projects-all"><a href="javascript:v1river.settings.setProject(\'\')">All</a></li>');
		var i, results, result;
        results = response.Assets;
        for ( i = 0; i < results.length; i++ ) {
          result = results[ i ];

		  $("#projects-menu").append("<li><a href=\"javascript:v1river.settings.setProject('" +  result.Attributes["Name"].value + "');\">" + result.Attributes["Name"].value) + "</a></li>";

		}

	  }
	});
 }

/** Controls visibility of reload button
 */
v1river.ui.isLoading = function(bLoading) {
	if(bLoading) {
		$('#reload').css("visibility:hidden;");
		$('#loading').css("visibility:visible");
	
	} else {
		$('#reload').css("visibility:hidden;");
		$('#loading').css("visibility:visible");
	}
}


/** Generate a summary message for the specific attribute / status change
 * Used in render pipeline
 * Todo: Add support for TimeBox change
 * @see v1river.fetcher.start
 */
v1river.ui.generateAction = function (itemDetails) {
	var action = '';
	// TODO Changed
	if( itemDetails.find("[name='Prior.ToDo']").text() != itemDetails.find("[name='ToDo']").text()  && (itemDetails.find("[name='Prior.ToDo']").text().length || itemDetails.find("[name='ToDo']").text().length)) {
		action = 'changed todo from ' + itemDetails.find("[name='Prior.ToDo']").text()  + ' to ' +  itemDetails.find("[name='ToDo']").text() + ' -- ';
	}
	// STory STate Changed
	if( itemDetails.find("[name='Prior.AssetState']").text() != itemDetails.find("[name='AssetState']").text()) {
		action = 'changed status';
		if(v1river.dataModel.assetStates[itemDetails.find("[name='Prior.AssetState']").text()]!= 'undefined') action+= ' from ' + v1river.dataModel.assetStates[itemDetails.find("[name='Prior.AssetState']").text()];
		if(v1river.dataModel.assetStates[itemDetails.find("[name='AssetState']").text()]!= 'undefined') action+= ' to ' + v1river.dataModel.assetStates[itemDetails.find("[name='AssetState']").text()];
		
	}
	// Owner CHanged	
	if(itemDetails.find("[name='Owners.Nickname']").text() != itemDetails.find("[name='Prior.Owners.Nickname']").text()) {
		action = 'Owner changed to ' + 	itemDetails.find("[name='Owners.Nickname']").text();
	}
	// New Item
	if( itemDetails.find("[name='ChangeDate']").text() == itemDetails.find("[name='CreateDate']").text()) {
		action='created';
	}
	// Status Change
	if( itemDetails.find("[name='Status.Name']").text() != itemDetails.find("[name='Prior.Status.Name']").text()) {
		action=' changed status to ' +  itemDetails.find("[name='Status.Name']").text();
	}
	// Closed
	if( itemDetails.find("[name='AssetState']").text() > 64) action = 'closed';
	// Fallback
	if(!action.length) action = 'edited ';
	return action;
}


/** Update UI with last data
 * Trigger throttle if slow data
 **/
v1river.ui.refreshTimes = function() {
	var str =  "";
	str += " last data: " + jQuery.timeago(v1river.lastUpdate);
	$("#updated").html(str);
	$(".timeago").each(function(){
		$(this).html( jQuery.timeago($(this).attr("changedate").substr(0,25)   ));														
	});
	if(v1river.lastUpdate) v1river.fetcher.throttle(new Date().getTime() - v1river.lastUpdate.getTime())
}			


/** If a message comes in fresher than 10 minutes, show a toast with the titaniumAPI
 */
v1river.ui.toaster = function(curItem) {
	var curItem;
	var maxToasts = 3;
	var nowTime = new Date().getTime();
	// Eligible for Tooltips?
	if(debugMode) console.log("Considering Toasting at " + jQuery.timeago(curItem.changedate) + " with " + (nowTime -curItem.changedate) + " and " + v1river.platform  ); 
	if(v1river.platform == 'titanium-desktop' && v1river.prefs.notifications) {
		if( nowTime -curItem.changedate   < (1000*60*15) ) { 
			v1river.titanium.toast( curItem.icon, curItem.title, curItem.action + ' ' + jQuery.timeago(curItem.changedate) + ' by ' + curItem.changedBy, curItem.href  ) ;
			if(!v1river.lastToast || curItem.changeDate > v1river.lastToast ) v1river.lastToast = curItem.changedate;
		}
	}
}


/** Delete items above v1river.maxNodes
 */
v1river.ui.prune = function() {
	var nodes = $("#" + v1river.outputElement + " .news-item");
	var lastNode;
	if(nodes.length > v1river.maxNodes) {
		lastNode = nodes[nodes.length-1]
		lastNode.parentNode.removeChild(lastNode);	
	}	
}
		
 /** Handle AJAX Request Failures
  * TODO: Identify error type
  */
v1river.ui.authFailure = function(err) {
	alert("Failed to connect to VersionOne instance.");
}


/** Sorts new items into the DOM
 * called from taffy onInsert
 **/
v1river.ui.publish = function(curItem) {
	if(debugMode) "Publising at " + curItem.moment;
	var node;
	var liveNode;
	if( curItem && typeof curItem.moment != 'undefined') {
		var str = '';
		var node = document.createElement("div");
		
		node.className='null news-item';
		node.setAttribute("moment", curItem.moment);

		str +='<div  class="byline">' + curItem.action + ' <span class="timeago" changedate="'+curItem.changedate.toString() +'">';
		str += jQuery.timeago(curItem.changedate) + '</span> by ' + curItem.changedBy + '</div>';

		str += '<h2 class="title">'
		if(parseInt(curItem.assetState) > v1river.dataModel.dead && parseInt(curItem.assetState) != v1river.dataModel.epic ) {
		// Open Item
			str +='<s><a href="' + curItem.href + '" target="ti:systembrowser">'
			str += '<img src="' + curItem.icon + '"  border="0" hspace="4" align="left" />' 
			str +=  curItem.title + '</a></s></h2>';
		} else {
		// Closed Item
			str += '<a href="' + curItem.href + '" target="ti:systembrowser">'
			str += '<img src="' +curItem.icon+ '" border="0"  hspace="4" align="left"/>'
			str += curItem.title + '</a></h2>';
		}
		str += '<div  class="itemDetail">'+ curItem.description  ;
		if(curItem.project.length) str += '<br/><em class="rider">in ' + curItem.project + '</em>'; 
		if(curItem.type == 'Task' || curItem.type == 'Test') {
			str+= ' in Story <a href="' + curItem.parentLink + '" target="ti:systembrowser">' + curItem.parentName + '</a>';
		}
		str += '</div>';
		node.innerHTML = str;
		//if(debugMode) console.log("Inserting " + curItem.type);
		v1river.insertNew(node);
		v1river.fetchRun++;
		v1river.lastFetch = new Date();
		console.log("Inspecting " + parseInt($("#" + v1river.outputElement).parent().attr("data:moment") ) );
		if( curItem.moment >  parseInt(v1river.getMaxMoment() ) ) {
			v1river.state.minMoment =curItem.moment;
			$("#" + v1river.outputElement).parent().attr("data:moment", curItem.moment);
			console.log("Updating max moment to " + curItem.moment);
		}
		v1river.ui.refreshTimes();
	}
	v1river.ui.prune()
}
