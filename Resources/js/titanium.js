/** Titanium platform specific functions
 * @namespace 
 */
v1river.titanium = {}

/* Toast an alert
 * @class
 */
 
v1river.titanium.toast = function showNotification(icon,title, message, href)
{
	if(debugMode) console.log("Toasting");	
	// Block notifications while in focus?  Nah.
	//if(typeof Titanium.FOCUSED != 'undefined' && !Titanium.FOCUSED) {
		var notification = Titanium.Notification.createNotification(window);
		notification.setTitle(title);
		notification.setMessage(message);
		notification.setIcon(icon);
		notification.setDelay(5000);
		notification.setCallback(function (href) {
			Titanium.Desktop.openURL(href);
		});
		notification.show();
	//}
}

v1river.titanium.createTray = function() {
	
// When the icon is clicked, swap the visibility of the window.
	v1river.trayItem = Titanium.UI.addTray("app://images/AllItems_16.png", function() {
		if (Titanium.UI.currentWindow.isVisible()) {
			Titanium.UI.currentWindow.hide();
		} else {
			Titanium.UI.currentWindow.show();
			Titanium.UI.currentWindow.restore();
			Titanium.UI.currentWindow.focus();  // Only works on OSX as of Titanium 0.6
				
		}
	});
}

v1river.titanium.isOnline = function() {
	return Titanium.Network.online;	
}

							 