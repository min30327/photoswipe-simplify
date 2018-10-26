/*!
 * photoswipe-simplify v0.0.1: PhotoSwipe.js simplify by the VanillaJS.
 * (c) 2018 Mineo Okuda
 * MIT License
 * git+ssh://git@github.com:min30327/photoswipe-simplify.git
 */

/**
 * Written by Mineo Okuda on 25/10/18.
 *
 * Mineo Okuda - development + design
 * https://willstyle.co.jp
 * https://github.com/min30327
 *
 * MIT license.
 */

(function(root, factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	}
	else if (typeof exports === 'object') {
		// COMMONJS
		module.exports = factory();
	}
	else {
		// BROWSER
		root.photoswipeSimplify = factory();
	}
}(this, (function() {

	'use strict';

		var defaults = {
			target : "[data-pswp]"
		};

		var extend = function () {

			// Variables
			var extended = {};
			var deep = false;
			var i = 0;
			var length = arguments.length;

			// Merge the object into the extended object
			var merge = function (obj) {
				for (var prop in obj) {
					if (obj.hasOwnProperty(prop)) {
						extended[prop] = obj[prop];
					}
				}
			};

			// Loop through each object and conduct a merge
			for ( i = 0; i < length; i++ ) {
				var obj = arguments[i];
				merge(obj);
			}

			return extended;

		};
		
		var photoswipeSimplify = function(){};

		photoswipeSimplify.prototype = {

			initialized: false,
			pswpElement: "",
			galleries : [],
			thumbnails : [],
			tmps : [],
			items : [],
			options : {},
			ImagesLoaded : false,

			init : function(options){
				var self = this;
				
				self.options = extend(defaults, options || {});
				if(!self.initialized){
					self.append_template();
					self.initialized = true;
				}
				self.initPhotoSwipe(self.options.target);
			},

			append_template: function (){
				var body = document.getElementsByTagName('body')[0];
				var elem = document.createElement('div');
				elem.innerHTML = '<div class="pswp" tabindex="-1" role="dialog" aria-hidden="true"><div class="pswp__bg"></div><div class="pswp__scroll-wrap"><div class="pswp__container"><div class="pswp__item"></div><div class="pswp__item"></div><div class="pswp__item"></div></div><div class="pswp__ui pswp__ui--hidden"><div class="pswp__top-bar"><div class="pswp__counter"></div><button class="pswp__button pswp__button--close" title="Close (Esc)"></button><button class="pswp__button pswp__button--share" title="Share"></button><button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button><button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button><div class="pswp__preloader"><div class="pswp__preloader__icn"><div class="pswp__preloader__cut"><div class="pswp__preloader__donut"></div></div></div></div></div><div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap"><div class="pswp__share-tooltip"></div> </div><button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button><button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button><div class="pswp__caption"><div class="pswp__caption__center"></div></div></div></div></div>';
				body.appendChild(elem);
			},

			initPhotoSwipe : function(selector) {
				var self = this;
				self.pswpElement = document.querySelectorAll('.pswp')[0];
				self.galleries = document.querySelectorAll( selector );

				if(self.galleries.length > 0){
					for(var i = 0; i < self.galleries.length; i++) {

						self.items[i] = [];
						self.thumbnails[i] = [];
						self.tmps[i] = self.galleries[i].getElementsByTagName('a');

						self.tmps[i] = Array.prototype.slice.call(self.tmps[i]);
						

						if(self.tmps[i].length > 0){
							for(var l = 0; l < self.tmps[i].length; l++) {

								var src = self.tmps[i][l].getAttribute('href');
								if (/(.gif|.jpe?g|.png|.bmp)/.test(src.toLowerCase())) {
									self.thumbnails[i].push(self.tmps[i][l]);
								}
							}
						}
						
						var promise = new Promise(function (resolve) {
							self.parseItems(resolve,i);
						});
						promise.then((function(){
							self.galleryLoaded();						
						}));
						if(self.thumbnails[i].length > 0){
							for(var n = 0; n < self.thumbnails[i].length; n++) {
								self.thumbnails[i][n].setAttribute('data-pswp-index',i);
								self.thumbnails[i][n].classList.add('pswp--item');

								self.attachEvent(self.thumbnails[i][n],i,n);
							}
						}
					}
				}
			},
			galleryLoaded : function(){
				var self = this;
				
				if(self.galleries.length > 0){
					for(var i = 0; i < self.galleries.length; i++) {
						self.galleries[i].classList.add('pswp--loaded');
					}
				}
			},

			attachEvent : function(el,galleryIndex,index){
				var self = this;

				el.addEventListener('click',(function(e){
					e.preventDefault();
					document.body.classList.add('pswp--launched');
					var active = document.querySelector('.pswp--active');
					if(active){
						active.classList.remove('pswp--active');
					}
					self.galleries[galleryIndex].classList.add('pswp--active');
					self.galleries[galleryIndex].setAttribute('data-pswp-index',index);
					if(self.galleries[galleryIndex].classList.contains('pswp--loaded')){
						if(index >= 0) {
							self.open(galleryIndex,index);
						}
					}
					
					return false;
				}));
			},

			getImageSizes : function(src,galleryIndex,i,title,author){
				var self = this;
		    	new Promise(function (resolve, reject) {
		    		
			    	var img = new Image();
					img.src = src;
		    		
					img.onload = function(){
						self.items[galleryIndex][i] ={
			    			src: src,
			    			w : img.naturalWidth,
			    			h : img.naturalHeight,
			    			title : title,
			    			author : author
			    		};
			    		resolve();
					};
				});
			},

			open :  function(galleryIndex,index) {

				var self = this;
				var pwsp;
				var gallery = self.galleries[galleryIndex];

				self.options.galleryUID = galleryIndex;
				self.options.index = index;
				
				self.options.getThumbBoundsFn = function(index) {
					var gallery = document.querySelector('.pswp--active');
					if(gallery){

						var thumbnail = gallery.querySelectorAll('.pswp--item')[index].getElementsByTagName('img')[0],
							pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
							rect = thumbnail.getBoundingClientRect(); 
						return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
						
					}
				};
				self.options.addCaptionHTMLFn = function(item, captionEl, isFake) {
					if(!item.title) {
						captionEl.children[0].innerText = '';
						return false;
					}
					captionEl.children[0].innerHTML = item.title;
					if(item.author){
						captionEl.children[0].innerHTML += '<br><small>' + item.author + '</small>';
					}
					return true;
				};
				
				document.body.classList.remove('pswp--launched');
				pwsp = new PhotoSwipe( self.pswpElement, PhotoSwipeUI_Default, self.items[galleryIndex], self.options);
		   		pwsp.init();

			},
			parseItems : function(resolve,galleryIndex) {
				
				var self = this;
				var promises = [];
				if(self.thumbnails[galleryIndex].length > 0){

					for(var i = 0;i < self.thumbnails[galleryIndex].length; i++) {

						var src = self.thumbnails[galleryIndex][i].getAttribute('href');
						var title = self.thumbnails[galleryIndex][i].getAttribute('data-caption');
						var author = self.thumbnails[galleryIndex][i].getAttribute('data-author');
							
						promises.push(self.getImageSizes(src,galleryIndex,i,title,author));
					    Promise.all(promises).then((function () {
					    	resolve();
					    }));
					}
				}
			}
		};
		var pswpSimplify = new photoswipeSimplify();

		return pswpSimplify;
	}))
);