NodeList.prototype.map = function(fnc){
	Array.prototype.slice.call(this).map(fnc);
}
String.prototype.accentAnnihilator = function(){
	return this.replace(/é|è|ê|ë/g, 'e').replace(/'ï|ì|î/g, 'i').replace(/'ù|û|ü/g, 'u').replace(/'ò|ö|ô/g, 'o').replace(/'œ/g, 'oe');
}

window.INSTANTCHAT = function(){
	var conf = {
		back : window.debug ? 'http://back.instantch.at' : 'http://10.0.2.1'
	};


	document.querySelectorAll('[view]:not(:first-child)').map(function(view){
        view.style.display = 'none';
    });

	var _loader = {
		view : document.querySelector('[view=loader]'),
		show : function(){
			_loader.view.style.position = 'absolute';
			_loader.view.style.display = 'block';

		},
		hide : function(){
			_loader.view.style.display = 'none';
		}
	};

	var listener = {
		deferred : $.Deferred().resolve(),
		signup : function(deferred){
			
			document.querySelector('[view=signup] form').onsubmit = function(event){
				_getUserSignup(deferred, event.target);
				return false;
			};
		},
		listtag : function(deferred){
			_getTags(deferred);
		}
	}



	var _go = {
		current : document.querySelector('[view]'),
		last : [],
		back: function(){
			if('pending' === listener.deferred.state()){
				listener.deferred.reject();
			}
			var view = _go.last.pop();
			if(view){
				listener.deferred = $.Deferred();
				_go.current.style.display = 'none';
				_go.current = document.querySelector('[view='+view+']');
				_go.current.style.display = 'block';

				listener[view] && listener[view](listener.deferred);
			}
			return listener.deferred;
		},
		to : function(view){
			if('pending' === listener.deferred.state()){
				listener.deferred.reject();
			}
			listener.deferred = $.Deferred();
			_go.last.push(_go.current.getAttribute('view'));
			_go.current.style.display = 'none';
			_go.current = document.querySelector('[view='+view+']');
			_go.current.style.display = 'block';
			listener[view] && listener[view](listener.deferred);
			return listener.deferred;
		}
	};

	var tool = {
		xhr : function(url, data){
			var _request = data;
			return $.ajax({
				url: url,
				type: 'GET',
				data: data,
				dataType: 'JSON'
			})
			.always(function(){
				_loader.hide();
			})
			.pipe(function(data, textStatus, jqXHR) {
				if(!data || data.status != 'ok' || 0 == data.data.length) {
					var deferred = $.Deferred(); 
					deferred.reject( {	data : data, request : _request } ); 	
					return deferred; 
				}else{
					var deferred = $.Deferred(); 
					deferred.resolve( data.data ); 
					return deferred; 
				}
			}, function(){
				var deferred = $.Deferred(); 
				deferred.reject(); 
				return deferred;
			});
		}
	};

	var permanentStorage = {
		addItem : function(object){
			var o = JSON.parse(window.localStorage.getItem("INSTANTCHAT")) || {};
			var newObject = $.extend(true, {}, o, object);
			window.localStorage.setItem("INSTANTCHAT", JSON.stringify(newObject).accentAnnihilator());
			return newObject;
		},
		getItem : function(){
			return JSON.parse(window.localStorage.getItem("INSTANTCHAT"));
		},
		isset : function(path){
			path = path.split('.');
			var object = window.localStorage.getItem("INSTANTCHAT");
			for (var i = path.length - 1; i >= 0; i--) {
				if(null == object || undefined == object[path]){
					return false;
				}else{
					object=object[path];
				}
			};
			return true;
		},
		clear : function(){
			window.localStorage.clear("INSTANTCHAT");
		}
	};
	permanentStorage.clear();
	
	var _phonenumber = function(){
		var deferred = $.Deferred();
		if(window.debug){
			deferred.resolve('049587lskf6315');
		}
		else if(permanentStorage.isset('user.phonenumber')){
			deferred.resolve(permanentStorage.getItem().user.phonenumber);
		}
		else{
			cordova.require("cordova/plugin/telephonenumber").get(function(result){
				deferred.resolve(result);
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
					deferred.resolve(results[0].formatted_address);
				}
			});
		};
		if(window.debug){
			deferred.resolve('rue Mandevile 23, 4000 Liège Belgique');
		}
		else if(permanentStorage.isset('user.address')){
			deferred.resolve(permanentStorage.getItem().user.address);
		}
		else{
			navigator.geolocation.getCurrentPosition(onSuccess, function(){});
		}
		return deferred.promise();
	};

	var _getUserSignup = function(deferred, form){
		var request = {};
		for (var i = form.length - 1; i >= 0; i--) {
			form[i].name && (request[form[i].name] = form[i].type != 'radio' || form[i].checked ? form[i].value : request[form[i].name]);
		};
		deferred.resolve({
			user : request
		});
	};

	var _getTags = function(deferred){
		tool.xhr(conf.back+'/get/tags').done(function(tags){
			var table = _go.current.querySelector('table tbody');
			table.querySelectorAll('tr').map(function(elem){
				table.removeChild(elem);
			});
			tags.sort(function(a,b){
				return a.name.localeCompare(b.name);
			}).map(function(tag){
				var tag = $('<tr><td tag_id="'+tag.tag_id+'">'+tag.name+'</td></tr>')[0];
				table.appendChild(tag);
				tag.onclick = function(event){
					var t = event.target;
					t.parentNode.classList.toggle('selected');
				}
			});
		});
	};

	var _ready = $.when(
			_phonenumber().done(function(phonenumber){
				tool.xhr(conf.back+'/get/users', {phonenumber : phonenumber} )
				.done(function(data){
					_go.to('listtag');
				})
				.fail(function(){
					_go.to('signup').done(function(user){
						permanentStorage.addItem(user);
						tool.xhr(conf.back+'/set/users', permanentStorage.getItem().user).done(function(){
							_go.to('listtag');
						}).fail(function(data){
							alert(data)
						})
					});
				})
			}),

			_getLocalisation()

		).done(function(phonenumber, address){
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
		go : _go,
		conf : conf,
		permanentStorage : permanentStorage
	}
	
};