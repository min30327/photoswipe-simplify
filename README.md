# photoswipe-simplify.js

PhotoSwipe.js simplify by the VanillaJS.


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

## Options

PhotoSwipe options can be used as they are.
Please see this page for details.
Specify the option as follows.

```html
photoswipeSimplify.init({
    history: false,
    focus: false,
});
```
