# photoswipe-simplify.js

PhotoSwipe.js simplify by the VanillaJS.

This script significantly reduces the complexity of setting up PhotoSwipe for your website, removing almost all script-editing requirements and allowing for more simplified, and larger-context gallery definitions. 


## Demo
[View the demo](http://min30327.github.io/photoswipe-simplify/)

## Installation

You can install it using npm:

```
npm install photoswipe photoswipe-simplify --save
```

Or just include the script in your page:

```html
<script src="path/to/photoswipe.js" charset="utf-8"></script>
<script src="path/to/photoswipe-ui-default.js" charset="utf-8"></script>
<script src="path/to/photoswipe-simplify.js" charset="utf-8"></script>
```

And, include the PhotoSwipe style in your page:

```html
<link rel="stylesheet" href="path/to/photoswipe.min.css">
<link rel="stylesheet" href="path/to/default-skin.min.css">
```

Included photoswipe-simplify.js in your project and initialize:

```html
<script charset="utf-8">
    photoswipeSimplify.init();
</script>
```


## Usage

```html
<!-- Wrapper element adding the [data-pswp] attribute. -->
<div data-pswp>
    <!-- Detect image links from internal elements and generate PhotoSwipe objects. -->
    <!-- If you want to display captions and authors, specify the data-caption and data-author attributes. -->
    <a href="test/img01.jpg" target="_blank" data-caption="This is dummy caption. It has been placed here solely to demonstrate the look and feel of finished, typeset text." data-author="Photo by pixabay.com"><img src="test/img01-thumb.jpg" alt=""></a>
    ...
</div>
```

The data-pswp attribute can be applied to much larger contexts than simply the immediate parent container. The gallery is defined by the scope of the parent container. For example:

```html
<section data-pswp>
	<div>
		<figure>
			<img />
			<figcaption></figcaption>
		</figure>
		<figure>
			<img />
			<figcaption></figcaption>
		</figure>
	</div>
	<div>
		<figure>
			<img />
			<figcaption></figcaption>
		</figure>
		<figure>
			<img />
			<figcaption></figcaption>
		</figure>
		<figure>
			<img />
			<figcaption></figcaption>
		</figure>
	</div>
</section>
```

Would consider all images between ```<section></section>``` to be part of the same gallery. 

## data-size attribute

PhotoSwipe on its own requires image sizes to be known in advance. This can be a major hurdle to setting up the script. PhotoSwipe simplify simplifies PhotoSwipe setup by automatically loading all the high-resolution images for a gallery and then calculating sizes to initialize PhotoSwipe. 

This may simplify setup but can drastically increase bandwidth usage on larger galleries. 

You can stop the pre-loading of high-resolution gallery images by adding the ```data-size``` attribute to the parent A tag, thusly:

```html
<a href="images/gallery-high/photo01.jpg" data-size="2000x3000"><img src="images/gallery-thumb/photo01.jpg" /></a>
````

PhotoSwipe simplify, on seeing the ```data-size``` attribute will use that to establish the necessary resolution data for PhotoSwipe. 




## PhotoSwipe Options

PhotoSwipe options can be used as they are.
Please see [this page](http://photoswipe.com/documentation/options.html) for details.

Specify the option as follows:

```html
photoswipeSimplify.init({
    history: false,
    focus: false,
});
```
