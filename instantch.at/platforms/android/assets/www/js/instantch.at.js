NodeList.prototype.map = function(fnc){
	return Array.prototype.slice.call(this).map(fnc);
}
String.prototype.accentAnnihilator = function(){
	return this.replace(/é|è|ê|ë/g, 'e').replace(/'ï|ì|î/g, 'i').replace(/'ù|û|ü/g, 'u').replace(/'ò|ö|ô/g, 'o').replace(/'œ/g, 'oe');
}

window.INSTANTCHAT = function(){
	var conf = {
		back : window.debug ? 'http://back.instantch.at' : 'http://10.0.2.1',
		default_phonenumber : '049kj5876315',
		default_address : 'rue Mandevile 23, 4000 Liège Belgique',
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
		},
		listcompany : function(deferred){
			_getCompany(deferred);
		},
	}

	var _go = {
		current : document.querySelector('[view]'),
		last : [],
		back: function(){
			if('pending' === listener.deferred.state()){
				listener.deferred.reject(_go.current);
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
				listener.deferred.reject(_go.current);
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
			deferred.resolve(conf.default_phonenumber);
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
			deferred.resolve(conf.default_address);
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

	var _setUserTagDisinterest = function(company){
		tool.xhr(conf.back+'/set/usertagdisinterest', {
			tag_id : company.querySelector('[tag_id]').getAttribute('tag_id'),
			user_id : permanentStorage.getItem().user.id 
		});
	};

	var _setUserTagInterest = function(tag_ids){
		console.log(tag_ids);
	};

	var _getCompany = function(deferred){
		// FIXME TAGID
		tool.xhr(conf.back+'/get/companies').done(function(companies){
			var table = _go.current.querySelector('table tbody');
			companies.sort(function(a,b){
				return a.name.localeCompare(b.name);
			}).map(function(company){
				console.log(company);
				var company = $('	<tr company_id="'+company.id+'">'+
								'				<td>'+company.name+'</td>'+
								'				<td>'+
								'					<button type="button" class="btn btn-primary btn-lg">Chat</button>'+
								'				</td>					'+
								'				</tr> ')[0];

				table.appendChild(company);
				company.querySelector('.btn-primary').onclick = function(event){
					var COMPANY = event.target.parentNode.parentNode;
					var interest = [];
					interest.push(COMPANY.querySelector('[company_id]').getAttribute('company_id'));
					table.querySelectorAll('.selected [company_id]').map(function(company){
						interest.push(company.getAttribute('company_id'));
					});
					_setUserTagInterest(interest);

					permanentStorage.addItem({
						company : {
							interest : interest,
						}
					});
				};
				company.onclick = function(event){
					event.target.parentNode.classList.toggle('selected')
				}
			});
		});
	};

	var _getTags = function(deferred){
		var selectedTag = [];
		tool.xhr(conf.back+'/get/tags', {
			user_id : permanentStorage.getItem().user.id 
		}).done(function(tags){
			var table = _go.current.querySelector('table tbody');
			table.querySelectorAll('tr').map(function(elem){
				table.removeChild(elem);
			});


			tags.sort(function(a,b){
				return a.tag_name.localeCompare(b.tag_name);
			}).map(function(tag){
				var tag = $('<tr><td tag_id="'+tag.tag_id+'">'+tag.tag_name+'</td><td><button type="button" class="btn btn-success btn-lg">Select</button><button type="button" class="btn btn-warning btn-lg">Delete</button></td></tr>')[0];
				table.appendChild(tag);

				tag.querySelector('.btn-success').onclick = function(event){
					var TAG = event.target.parentNode.parentNode;
					var interest = [];
					interest.push(TAG.querySelector('[tag_id]').getAttribute('tag_id'));
					table.querySelectorAll('.selected:not(.not) [tag_id]').map(function(tag){
						interest.push(tag.getAttribute('tag_id'));
					});
					_setUserTagInterest(interest);

					permanentStorage.addItem({
						tag : {
							interest : interest,
						}
					});

					deferred.resolve(interest);
					return false;
				};

				tag.querySelector('.btn-warning').onclick = function(event){
					var TAG = event.target.parentNode.parentNode;
					_setUserTagDisinterest(TAG);
					table.removeChild(TAG);
					return false;
				};
				tag.onclick = function(event){
					var t = event.target;
					if(t.parentNode.classList.contains('not') && t.parentNode.classList.contains('selected')){
						t.parentNode.classList.remove('not');
						t.parentNode.classList.remove('selected');
					}
					else if (t.parentNode.classList.contains('selected')){
						t.parentNode.classList.add('not');
					}
					else{
						t.parentNode.classList.add('selected');
					}
				}
			});
		});
	};

	var _listtagDone = function(){
		_go.to('listcompany');
	}
	var _listtagFail = function(view){
		_go.to('listcompany');
	}

	var _ready = $.when(
			_phonenumber().done(function(phonenumber){
				tool.xhr(conf.back+'/get/users', {phonenumber : phonenumber} )
				.done(function(data){
					permanentStorage.addItem({
						user : data[0]
					});
					_go.to('listtag').done(_listtagDone);
				})
				.fail(function(){
					_go.to('signup').done(function(user){
						permanentStorage.addItem(user);
						tool.xhr(conf.back+'/set/users', permanentStorage.getItem().user).done(function(){
							_go.to('listtag').done(_listtagDone);
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