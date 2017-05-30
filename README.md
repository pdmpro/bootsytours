# bootsytours
This is a (very) little JavaScript library that wraps Bootstrap Tour, allowing one or more guided
tours to be created in a web page *without* coding.

It's named after the great [Bootsy Collins](https://en.wikipedia.org/wiki/Bootsy_Collins) (but only because his name has "boot" in it).

## Prerequisites
Requires Bootstrap Tour, which in turn runs on Bootstrap and jQuery.

## Usage
The content and the objects that the tour tooltips point to are all in your HTML -- no JavaScript
coding required (yay!). That also means clean separation of concerns (content lives in HTML and functionality
lives in script -- yay!). Everything works on the naming convention described below. Follow the convention
in your HTML and CSS and the rest is magic.

Tours (you can quite easily have more than one on a given page) are only initialized when the first tour stop is
displayed. For example, if the user clicks a button to start a tour, we do initialization at that moment, not before.

### Steps

When any tour is starting...

* We query for all tags with a class of tourStop.
 * Each .tourStop needs a direct child (`<aside>`) where the content for the tooltip goes.
	It also needs a `data-tour-target` attribute with the id of the element the tooltip will point to when shown.
	(If omitted, or if the target element doesn't exist, it will point to the wrapper, and if that's hidden or in a
	weird place, the behavior will be weird.)
 * The `.tourStop` also needs to tell us the name of the tour to which it belongs, unless it wants to be in the
	default. (This lets you easily have more than one tour on each page.) The name goes into the tag's `data-tour-id`
	attribute. Again, if it's omitted, the tour stop is put in the default _([sine nomine](https://en.wikipedia.org/wiki/Sine_nomine))_ tour.
 * The `.tourStop` can optionally tell the tour how to position the tooltip with the `data-placement` attribute.
	Valid values are specified by Bootstrap Tour, so check their documentation.
 * The `aside` contains rich content for display in the tooltip. It can (should) also tell us the title for the tooltip
	via the `data-tour-title` attribute.
 * Using all that structure, we've now found the particulars for all tours on the page; the last step is to instantiate
	Boostrap Tour's `Tour` class with the required step data, and call the start method. They take it from there.

### Notes

* The tour will flow in the order that jQuery returns the `.tourStop` elements, so to control that order, you merely
	arrange your HTML appropriately. Because the targets are explicitly called out, the tour can bounce around the page
	however you like.
* The naming convention is hard-coded (tucked inside a private property of the JavaScript
	tool that runs the show). So, if you want to change them, you only have to do it once, but it does mean
	modding the source code. _(Future enhancement: make these overridable.)_
	
## Author
* Glen Ford - initial work - [pdmpro](https://github.com/pdmpro)
