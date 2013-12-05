window.INSTANTCHAT = function(){
	var permanentStorage = {
		addItem : function(object){
			var o = JSON.parse(window.localStorage.getItem("INSTANTCHAT")) || {};
			var newObject = $.extend(true, {}, o, object);
			window.localStorage.setItem("INSTANTCHAT", JSON.stringify(newObject));
			return newObject;
		},
		getItem : function(){
			return JSON.parse(window.localStorage.getItem("INSTANTCHAT"));
		},
		isset : function(path){
			path = path.split('.');
			var object = window.localStorage.getItem("INSTANTCHAT");
			for (var i = path.length - 1; i >= 0; i--) {
				if(undefined !== object[path]){
					object = object[path]
				}
				else{
					return true;
				}
				return false;
			};
		},
		clear : function(){
			window.localStorage.clear("INSTANTCHAT");
		}
	};
	
	var _phonenumber = function(){
		var deferred = $.Deferred();
		if(window.debug){
			deferred.resolve('+32495876315');
		}
		else if(permanentStorage.isset('user.phonenumber')){
			deferred.resolve(permanentStorage.get().user.phonenumber);
		}
		else{
			cordova.require("cordova/plugin/telephonenumber").get(function(result){
				deferred.resolve({
					user : {
						phonenumber : result
					}
				});
			});
		}
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
				if (status == google.maps.GeocoderStatus.OK){
					deferred.resolve({
						user : {
							address : results[0].formatted_address
						}
					});
				}
			});
		};
		if(window.debug){
			deferred.resolve('rue Mandevile 23, 4000 Liège Belgique');
		}
		else if(permanentStorage.isset('user.address')){
			deferred.resolve(permanentStorage.get().user.address);
		}
		else{
			navigator.geolocation.getCurrentPosition(onSuccess, function(){});
		}
		return deferred.promise();
	};

	var _ready = $.when(_phonenumber(), _getLocalisation()).done(function(phonenumber, address){
		permanentStorage.addItem({
			user : {
				address : address,
				phonenumber : phonenumber
			}
		});
	});

	return {
		getCurentUser : function(){
			return permanentStorage.getItem()
		},
		ready : function(fnc){
			_ready.done(fnc);
			return this;
		},
		permanentStorage : permanentStorage
	}
	
};