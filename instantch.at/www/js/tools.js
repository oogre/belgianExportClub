var tools = (function(){
	phonenumber : (function(){

		cordova.require("cordova/plugin/telephonenumber").get(function(result){
			tools.phonenumber = result;
		}, function() {

		});	
	}()),
	geolocalisation : (function(){
		var onSuccess = function(position){
			tools.geolocalisation = {
				latitude : position.coords.latitude,
				longitude : position.coords.longitude
			};
		};
		var onError = function(position){
			tools.geolocalisation = false;
		};
		navigator.geolocation.getCurrentPosition(onSuccess, onError);
	}())
	/**/	
}());