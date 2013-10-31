jQuery(function ($) {
    'use strict';

    var cache = {};

    var Utils = {
    	uuid: function () {
            /*jshint bitwise:false */
            var i, random;
            var uuid = '';

            for (i = 0; i < 32; i++) {
                random = Math.random() * 16 | 0;
                if (i === 8 || i === 12 || i === 16 || i === 20) {
                        uuid += '-';
                }
                uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
            }

            return uuid;
        },
    	store: function (namespace, data) {
            if (arguments.length > 1) {
                return localStorage.setItem(namespace, JSON.stringify(data));
            } else {
                var store = localStorage.getItem(namespace);
                return (store && JSON.parse(store)) || [];
            }
        },
        tmpl: function(str, data) {
			// Figure out if we're getting a template, or if we need to
			// load the template - and be sure to cache the result.
			var fn = !/\W/.test(str) ?
			  cache[str] = cache[str] ||
			    this.tmpl(document.getElementById(str).innerHTML) :

			  // Generate a reusable function that will serve as a template
			  // generator (and which will be cached).
			  new Function("obj",
			    "var p=[],print=function(){p.push.apply(p,arguments);};" +

			    // Introduce the data as local variables using with(){}
			    "with(obj){p.push('" +

			    // Convert the template into pure JavaScript
			    str
			      .replace(/[\r\t\n]/g, " ")
			      .split("<%").join("\t")
			      .replace(/((^|%>)[^\t]*)'/g, "$1\r")
			      .replace(/\t=(.*?)%>/g, "',$1,'")
			      .split("\t").join("');")
			      .split("%>").join("p.push('")
			      .split("\r").join("\\'")
			  + "');}return p.join('');");

			// Provide some basic currying to the user
			return data ? fn( data ) : fn;
		}
    };

    var App = {
    	init: function() {
    		this.MAX_LENGTH = 2258;
    		this.ENTER_KEY = 13;
    		this.NAMESPACE = 'hobbies';
    		this.NAMESPACE_FRIEND = 'friendHobbies';
    		this.storage = Utils.store(App.NAMESPACE);
    		this.friendStorage = Utils.store(App.NAMESPACE_FRIEND);
            this.cacheElements();
            this.bindEvents();
            this.render();
            this.renderFriend();
    	},

    	cacheElements: function() {
    		this.hobbyTemplate = Utils.tmpl('hobbyTmpl');
    		this.hobbyFriendTemplate = Utils.tmpl('hobbyFriendTmpl');
    		this.$newHobby = $('#newHobby');
    		this.$myHobbiesList = $('#myHobbies');
    		this.$friendHobbiesList= $('#myFriendHobbies');
    	},

    	bindEvents: function() {
    		var list = this.$myHobbiesList,
    			friendList = this.$friendHobbiesList;
    		this.$newHobby.on('keyup', this.create);
    		list.on('click', '.remove', this.remove);
    		list.on('click', '.more', this.showMoreThree);
    		friendList.on('click', '.add', this.add);
    		friendList.on('click', '.warning', this.warning);
    	},

    	render: function() {
    		this.$myHobbiesList.html( this.hobbyTemplate({hobbies: this.storage}) );
    		Utils.store(App.NAMESPACE, this.storage);
    	},

    	renderFriend: function() {
    		this.$friendHobbiesList.html( this.hobbyFriendTemplate({hobbies: this.friendStorage}) );
    		Utils.store(App.NAMESPACE_FRIEND, this.friendStorage);
    	},

    	/* Actions */

    	create: function(e) {
    		var $input = $(this),
            	val = $.trim($input.val());

            if (e.which !== App.ENTER_KEY || !val) {
                   return;
            }

            if (val.length > App.MAX_LENGTH) {
            	alert('Вы привысили допустимое количество символов в поле!');
            	return;
            }

            App.storage.push({
                id: Utils.uuid(),
                title: val,
                visible: App.lessThen2('storage')
            });

            $input.val('');
            App.render();
    	},

    	remove: function() {
    		var storage = App.storage,
    			id = $(this).closest('li').data('id');

    		$.each(storage, function(i, el) {
    			if (el && el.id === id) {
    				App.storage.splice(i, 1);

    				$.each(App.friendStorage, function(i, el) {
    					if (el.id === id) {
    						App.friendStorage[i].hasRelation = false;
    					}
    				});

    				App.render();
    				App.renderFriend();
    				return;
    			}
    		});
    	},

    	add: function() {
    		var $li = $(this).closest('li'),
    			val = $li.find('.title').text(),
    			id = $li.data('id');

            $.each(App.friendStorage, function(i, el) {
            	if (el.id === id) {
            		App.storage.push({
		                id: id,
		                title: val,
		                fromFriend: true,
		                visible: App.lessThen2('storage')
		            });

		            App.friendStorage[i].hasRelation = true;
            	}
            });

    		App.render();
    		App.renderFriend();
    	},

    	warning: function() {
    		var name = $.trim($(this).closest('li').find('.title').text());
    		var complain = confirm('Хобби "' + name + '" раздражает вас?\nХотите пожаловаться администратору?');
    		if (complain) {
    			alert('Сообщенеи отправлено.\nСпасибо за вашу активную позицию.\nВаше мнение очень важно для нас!')
    		}
    	},

    	showMoreThree: function() {
    		var count = 3,
    			storage = 'storage';

    		if ($(this).closest('ul').hasClass('myFriendHobbies')) {
    			storage = 'friendStorage';
    		}

    		$.each(App[storage], function(i, el) {
    			if (count <= 0) {
    				return;
    			}

    			if (!el.visible) {
    				App[storage][i].visible = true;
	    			count--;
    			}
    		});

    		App.render();
    		App.renderFriend();
    	},

    	/* Helpers */
    	getVisibleCounts: function(storage) {
    		var count = 0

    		$.each(App[storage], function(i, el) {
    			if (el.visible) {
    				++count;
    			}
    		});

    		return count;
    	},

    	lessThen2: function(storage) {
    		return (App.getVisibleCounts(storage) < 2);
    	}
    };

    var FactoryGirls = {
    	init: function() {
    		if (!this.supportsHtml5Storage) {
    			alert("Нет поддержки локальной DB.\nПожалуйста воспользуйтесь другим браузером!")
    			return;
    		}

    		if (!this.hasElements) {
    			this.setData();
    		}
    	},

    	setData: function() {
    		Utils.store("friendHobbies", this.getData());
    	},

    	getData: function() {
    		return [{
	    		id: Utils.uuid(),
			    title: "Баскетбол",
			    visible: true
	    	},
	    	{
	    		id: Utils.uuid(),
			    title: "Нарезка Photoshop/Fireworks макетов на скорость, в экстримельных условиях, на природе",
			    visible: true
	    	}];
    	},

    	hasElements: function() {
    		return !!Utils.store("friendHobbies").length;
    	},

    	supportsHtml5Storage: function() {
			try {
				return 'localStorage' in window && window['localStorage'] !== null;
			} catch (e) {
				return false;
			}
		}
    }

    FactoryGirls.init();
    App.init();
})