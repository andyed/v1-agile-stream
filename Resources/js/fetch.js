
/** Namespace for grabbing data
 * @namespace
 */ 
v1river.fetcher = {}


/** Query Building for where clauses
 * Deals with initial name= string construction
 */
v1river.fetcher.queryWhereBuilder = function(whereString,param) {
	if(!whereString.length)  {
		whereString = '&where='
	} else {
		whereString += ";"
	}
	return whereString + param;
}

/** Slows down fetching if no data has been recently received
 * @param lag  current delta since last data
 */
v1river.fetcher.throttle = function(lag) {
	if(debugMode) console.log("Throttle lag " + lag);	
	if(lag > 1000 * 60 * 30) {
		v1river.state.refreshRate = lag;
	} else {
		v1river.state.refreshRate = v1river.defaultRefreshRate;
	}
}


/** Constructs URLs for an assetType
 * @param AssetType 
 */
v1river.fetcher.queryBuilder = function(type) {	 
	var whereString = '';
	var sels = v1river.dataModel.sels;	
	
		
	 if(v1river.prefs.projectname.length && type != 'Changeset') {
		if(type == 'Attachment' || type == 'Note') {
			whereString += "&where=Asset:PrimaryWorkitems.Scope.ParentMeAndUp.Name='" + v1river.prefs.projectname  + "'";				
		} else {
			whereString += "&where=Scope.ParentMeAndUp.Name='" + v1river.prefs.projectname  + "'";
		}
	 }

	if(type == 'ChangeSet') {
		if(v1river.prefs.projectname.length) whereString = v1river.fetcher.queryWhereBuilder(whereString,"PrimaryWorkitems.Scope.ParentMeAndUp.Name='" + v1river.prefs.projectname  + "'");
	} else {
		if(type == 'Workitems') whereString = v1river.fetcher.queryWhereBuilder (whereString ,'AssetType=' + v1river.dataModel.workitems);	
	}
	if( $("#" + v1river.outputElement).parent().attr("data:moment")  > 0 ) {
		whereString = v1river.fetcher.queryWhereBuilder(whereString,"Moment>'" +  $("#" + v1river.outputElement).parent().attr("data:moment")   + "'");
		if(debugMode) console.log("\n---PARTIAL UPDATE ---");

	}	
	// Mode is empty if in main tab, "my" if in my tab		
	if(v1river.mode.length) {
		if(type == "Attachment" || type == "Note") {
			whereString = v1river.fetcher.queryWhereBuilder(whereString,"CreatedBy.IsSelf='TRUE'|ChangedBy.IsSelf='TRUE'");	
		} else {
			whereString = v1river.fetcher.queryWhereBuilder(whereString,"Owners.IsSelf='TRUE'|ChangedBy.IsSelf='TRUE'");
		}
	}
		
	return v1river.prefs.path + 'rest-1.v1/Data/' + type + '?sort=-Moment&page=' + v1river.count + ',0&sel=' + sels[type]+whereString;
		 
		 
}





/* Generate authentication header value from Base64 of user/pass
 * @see v1river.fetcher.start
 */
v1river.fetcher.authHeader = function() {
	var username = v1river.prefs.username;
	var password = v1river.prefs.password;
	var authToken = Base64.encode(username + ":" +password);
	return "Basic " + authToken;
}

/* Do fetches for each type of data.
 * Massages data and stuffs it in the TaffDB 
 * which renders via an onInsert callback
 * @see v1river.ui.publish
 */
 
v1river.fetcher.start = function () {
	var urlString;
	if(debugMode) console.log("\n----STARTING Fetch ------");
	
	var types = 'Workitem,ChangeSet,Note,Attachment'; //,Note';
	types = types.split(",");
	
	if(v1river.titanium.isOnline) {
	for(var i=0;i<types.length;i++) {
		console.log("Processing " + types[i]);
		 urlString = v1river.fetcher.queryBuilder(types[i]);
		 if(debugMode) console.log(urlString);
		 v1river.pending++;
		 v1river.ui.isLoading(true);
			jQuery.ajax({
			  type: "GET",
			  beforeSend: function(xhr) {xhr.setRequestHeader("Authorization",v1river.fetcher.authHeader () );} ,		  
			  url: urlString,
			  dataType: "xml",
			  error: function(xhr, ajaxOptions, thrownError) {
				if(debugMode) console.log("Status:" + xhr.status + " : " + thrownError);                                    
				v1river.pending--;
				if(!v1river.pending) v1river.ui.isLoading(false);  // unlock loading semaphore
			  },
		
			success: function(responseData) {
				v1river.pending--;
				if(!v1river.pending) v1river.ui.isLoading(false);
				var items = [];
				var count = 0;
				xmlDoc = jQuery(responseData);		
				var resultCount = xmlDoc.find("Assets").attr("total");
				xmlDoc.find("Assets").children("Asset").each(
					function(itemIndex) {
						var itemDetails = jQuery(this);
						var href = itemDetails.attr("href");
						var id = itemDetails.attr("id");
						var type = '';
						var idval = '';
						var timestamp, datemod;
						var assetType;

						if(id != 'undefined') {
							type = id.split(":")[0];
							idval = id.split(":")[1];
							var action='';
							var href = v1river.prefs.path + 'assetdetail.v1?oid=' + id;
							timestamp = itemDetails.find("[name='ChangeDate']").text();
							datemod = new Date();
							datemod.setTime(Date.parse(timestamp.split("T")[0] + ' ' + timestamp.split("T")[1].split(":").splice(0,2).join(":") ));
							assetType = itemDetails.find("[name='AssetType']").text();
							if(!v1river.lastfetch || datemod > v1river.lastfetch) {
								

								switch(assetType) 
									{ 
									case 'Attachment':
										v1river.items.push({
											rawchangedate: itemDetails.find("[name='ChangeDate']").text(),
											changedate: datemod, 
											title:  "Attachment  " + itemDetails.find("[name='ID.Name']").text() + " on " + itemDetails.find("[name='Asset.Name']").text()  ,
											description: itemDetails.find("[name='Description']").text(),  
											href:  v1river.prefs.path + 'assetdetail.v1?oid=' + itemDetails.attr("id"),
											changedBy:itemDetails.find("[name='CreatedBy.Name']").text(),
											assetState: '',
											project: itemDetails.find("[name='Scope.Name']").text(),
											status: '',
											number: itemDetails.find("[name='Number']").text(),
											type: itemDetails.find("[name='AssetType']").text(),
											icon:  'images/'+v1river.dataModel.getIcon(  assetType ) +'.png',
											action: 'attached ',
											moment: itemDetails.find("[name='Moment']").text(),
											parent:  itemDetails.find("[name='Name']").find("idref")
										});
										break;
										case 'Note':
										v1river.items.push({
											rawchangedate: itemDetails.find("[name='ChangeDate']").text(),
											changedate: datemod, 
											title:  "Noted  " + itemDetails.find("[name='ID.Name']").find("Value").text() + " on " + itemDetails.find("[name='Asset.Name']").text()  ,
											description: itemDetails.find("[name='Content']").text(), 
											href:  v1river.prefs.path + 'assetdetail.v1?oid=' + itemDetails.attr("id"),
											changedBy:itemDetails.find("[name='CreatedBy.Name']").text(),
											assetState: '',
											project: itemDetails.find("[name='Scope.Name']").text(),
											status: '',
											number: itemDetails.find("[name='Number']").text(),
											type: itemDetails.find("[name='AssetType']").text(),
											icon:  'images/'+v1river.dataModel.getIcon(  assetType ) +'.png',
											action: 'added a note ',
											moment: itemDetails.find("[name='Moment']").text(),
											parent:  itemDetails.find("[name='Asset.Name']").find("idref")
										});
										break;
									case 'ChangeSet':
										v1river.items.push({
											rawchangedate: itemDetails.find("[name='ChangeDate']").text(),
											changedate: datemod, 
											title:  "Checkin to " + itemDetails.find("[name='PrimaryWorkitems.Name']").find("Value").text(),
											description: itemDetails.find("[name='Description']").text(), 
											href: href,
											changedBy:itemDetails.find("[name='Name']").text(),
											assetState: itemDetails.find("[name='AssetState']").text(),
											project: itemDetails.find("[name='Scope.Name']").text(),
											status: '',
											number: itemDetails.find("[name='Number']").text(),
											type: itemDetails.find("[name='AssetType']").text(),
											icon: v1river.prefs.path + 'images/Clifton/icons/' +v1river.dataModel.getIcon(  assetType ) +'-Icon.gif',
											action: 'checked in',
											moment: itemDetails.find("[name='Moment']").text(),
											parent: itemDetails.find("[name='Parent.Number']").text()
										});
										break;
									default:
										v1river.items.push({
											rawchangedate: itemDetails.find("[name='ChangeDate']").text(),
											status: itemDetails.find("[name='PrimaryWorkitems.Status']").text(),
											icon: v1river.prefs.path + 'images/Clifton/icons/'+ v1river.dataModel.getIcon(  assetType ) +'-Icon.gif',
											changedate: datemod,
											title: itemDetails.find("[name='Status.Name']").text() + " " + itemDetails.find("[name='Number']").text() + "::" + itemDetails.find("[name='Name']").text() ,
											description: itemDetails.find("[name='Description']").text(),  									
											href: href,
											number: itemDetails.find("[name='Number']").text(),
											changedBy:itemDetails.find("[name='ChangedBy.Name']").text(),
											type: itemDetails.find("[name='AssetType']").text(),
											assetState: itemDetails.find("[name='AssetState']").text(),
											project: itemDetails.find("[name='Scope.Name']").text(),
											action: v1river.ui.generateAction(itemDetails),
											moment: itemDetails.find("[name='Moment']").text(),
											parent: itemDetails.find("[name='Parent.Number']").text(),
											parentName: itemDetails.find("[name='Parent.Name']").text(),
											parentLink: v1river.prefs.path + itemDetails.find("[name='Parent']").find("Asset").attr("href")
										});
										break;
									}
								v1river.itemdb.insert(v1river.items[v1river.items.length-1]);
							}
						}
					v1river.lastUpdate = new Date();
					
				});
			v1river.fetchCount++;
	
			}
		})
	}	
    v1river.monitor(); 
	}
} 

/** Full refresh from UI button
 */
v1river.fetcher.cleanUpdate = function() {
	window.clearTimeout(v1river.fetchTimer);
	v1river.fetchTimer = window.setInterval(v1river.fetcher.start, v1river.refreshRate);
	v1river.reinit();
	v1river.fetcher.start();
}





