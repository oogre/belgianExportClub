window.INSTANTCHAT = function(){
	var permanentStorage = {
		addItem : function(object){
			var o = JSON.parse(window.localStorage.getItem("INSTANTCHAT")) || {};
			var newObject = $.extend(true, {}, o, object);
			window.localStorage.setItem("INSTANTCHAT", JSON.stringify(newObject));
			return newObject;
		},
		getItem : function(){
			return window.localStorage.getItem("INSTANTCHAT");
		},
		clear : function(){
			window.localStorage.clear("INSTANTCHAT");
		}
	};
	permanentStorage.clear()
	permanentStorage.addItem({
		user : {
			phonenumber : false,
			address : false
		}
	});

	var _phonenumber = function(){
		var deferred = $.Deferred();
		cordova.require("cordova/plugin/telephonenumber").get(function(result){
			deferred.resolve();
			permanentStorage.addItem({
				user : {
					phonenumber : result
				}
			});
		});
		return deferred.promise();
	};

	var _getLocalisation = function(){
		var deferred = $.Deferred();
		var onSuccess = function(position){
			var geocoder = new google.maps.Geocoder();
			var latLng = { 
				latLng : new google.maps.LatLng(position.coords.latitude,position.coords.longitude)
			}
			geocoder && geocoder.geocode(latLng, function (results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					permanentStorage.addItem({
						user : {
							address : results[0].formatted_address
						}
					});
					deferred.resolve();
				}
			});
		};
		navigator.geolocation.getCurrentPosition(onSuccess, function(){});
		return deferred.promise();
	};

	var _ready = $.when(_phonenumber(), _getLocalisation());

	return {
		getCurentUser : function(){
			return permanentStorage.getItem()
		},
		ready : function(fnc){
			_ready.done(fnc);
			return this;
		}
	}
	
};