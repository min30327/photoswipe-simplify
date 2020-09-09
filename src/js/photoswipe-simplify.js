
/**
 * Written by Mineo Okuda on 25/10/18.
 *
 * Mineo Okuda - development + design
 * https://willstyle.co.jp
 * https://github.com/min30327
 *
 * MIT license.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      return constructor.resolve(callback()).then(function() {
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!arr || typeof arr.length === 'undefined')
      throw new TypeError('Promise.all accepts an array');
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    for (var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  (typeof setImmediate === 'function' &&
    function(fn) {
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (!('Promise' in globalNS)) {
  globalNS['Promise'] = Promise;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
}

})));


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
}(this, function() {

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
						promise.then(function(){
							self.galleryLoaded();						
						});
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

				el.addEventListener('click',function(e){
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
				});
			},

			getImageSizes : function(node,src,galleryIndex,i,title,author){
				var self = this;
		    	new Promise(function (resolve, reject) {
		    		
		    	// Addition to check for data-size attribute so you don't have
	        // to load every high-resolution image if unnecessary 
	        if(node.getAttribute('data-size')) {
	          var size = node.getAttribute('data-size').split('x');
	          self.items[galleryIndex][i] = {
	              src: src,
	              w: parseInt(size[0], 10),
	              h: parseInt(size[1], 10),
	              title: title,
	              author: author
	            };
	          resolve();
	        } 
	        // If no data-size, then OK, fine, load the high-res image
	        // to read size
	        else {
	          var img = new Image();
	          img.src = src;

	          img.onload = function () {
	            self.items[galleryIndex][i] = {
	              src: src,
	              w: img.naturalWidth,
	              h: img.naturalHeight,
	              title: title,
	              author: author
	            };
	            resolve();
	          };
	        }
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

						var node = self.thumbnails[galleryIndex][i];
	          var src = self.thumbnails[galleryIndex][i].getAttribute('href');
	          var title = self.thumbnails[galleryIndex][i].getAttribute('data-caption');
	          var author = self.thumbnails[galleryIndex][i].getAttribute('data-author');

	          promises.push(self.getImageSizes(node, src, galleryIndex, i, title, author));
					    Promise.all(promises).then(function () {
					    	resolve();
					    });
					}
				}
			}
		};
		var pswpSimplify = new photoswipeSimplify();

		return pswpSimplify;
	})
);