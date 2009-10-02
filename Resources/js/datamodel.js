/** VersionOne Model data
 * @namespace 
 */
v1river.dataModel = {
		workitems: "'Story','Task','Defect'",
		dead: 64,
		epic: 208
	}


v1river.dataModel.assetStates = {		
	  0:'Future',
	  64: 'Active',
	  128: 'Closed',
	  192: 'Dead',
	  255: 'Deleted',	
	},

/** Mapping of AssetType to values selected
 * @const
 */
v1river.dataModel.sels =  {
	"Workitem":  "AssetType,ChangeDate,CreateDate,Name,Description,Number,Moment,Parent.Number,Parent.Name,Parent,Owners,AssetState,Scope,ChangedBy.Name,Scope.Name,Prior.Owners," + 
	"Prior.AssetState,Prior.ToDo,ToDo,Timebox,Prior.Timebox,PrimaryWorkitem.Status,Prior.Owners",
	"ChangeSet": "AssetType,ChangeDate,Reference,Name,Description,ChangedBy.Name,PrimaryWorkitems,Moment,PrimaryWorkitems.Scope.Name",
	"Note": "CreatedBy.Name,AssetType,Note.Content,Note.ID,Asset,Note.Name,Note.Moment,ChangeDate,Scope.Name",
	"Attachment" : "CreatedBy.Name,AssetType,Moment,Attachment.Asset,ChangeDate,Attachment.Name,Attachment.Description,Attachment.Asset",
}

/** Return an icon for an assetType
 * @param assetType
 */
v1river.dataModel.getIcon = function (assetType) {
		var icon = '';
		var dtype = '';
		switch ( assetType.toLowerCase()) {
			case 'story': 
				dtype = 'Story';
				icon = 'Feature';
				break;
			case 'issue':
				dtype = 'Issue';
				icon = 'Issue';
				break;
			case 'defect': 
				dtype = 'Defect';
				icon = 'Defect';
				break;
			case 'task': 
				dtype = 'Task';
				icon = 'Task';
				break;
			case 'test': 
				dtype = 'Test';
				icon = 'Test';
				break;
			case 'sprint': 
				dtype = 'Timebox';
				break;
			case 'changeset': 
				dtype = 'ChangeSet';
				icon = 'ChangeSet';
				break;		
			case 'note':
				dtype = 'Note';
				icon = 'Note';
				break;
			case 'attachment':
				dtype = 'Attachment';
				icon = 'Attachment';
				break;
		}
		return icon;
}