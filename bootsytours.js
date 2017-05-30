// FIXME (doc): explicit placement isn't supported, so explain this in the docs and remove placementAttribName
// FIXME: when an explicit step is started (or even maybe when a main button is clicked), need to make sure the existing tour is stopped
/*
HOW MY TOURS WORK:
First of all, the guided tours run on Bootstrap Tour, which runs on Bootstrap and jQuery.
The content and the objects that the tour tooltips point to are all in your HTML -- no JavaScript
coding required (yay!). That also means clean separation of concerns (content lives in HTML and functionality
lives in script -- yay!). Everything works on the naming convention described below. Follow the convention
in your HTML and CSS and the rest is magic.

Tours (you can quite easily have more than one on a given page) are only initialized when the first tour stop is
displayed. For example, if the user clicks a button to start a tour, we do initialization at that moment, not before.

STEPS: When any tour is starting...
- We query for all tags with a class of tourStop.
--- Each .tourStop needs a direct child (<aside>) where the content for the tooltip goes.
	It also needs a data-tour-target attribute with the id of the element the tooltip will point to when shown.
	(If omitted, or if the target element doesn't exist, it will point to the wrapper, and if that's hidden or in a
	weird place, the behavior will be weird.)
--- The .tourStop also needs to tell us the name of the tour to which it belongs, unless it wants to be in the
	default. (This lets you easily have more than one tour on each page.) The name goes into the tag's data-tour-id
	attribute. Again, if it's omitted, the tour stop is put in the default (sine nomine) tour.
--- The .tourStop can optionally tell the tour how to position the tooltip with the data-placement attribute.
	Valid values are specified by Bootstrap Tour, so check their documentation.
--- The aside contains rich content for display in the tooltip. It can (should) also tell us the title for the tooltip
	via the data-tour-title attribute.
--- Using all that structure, we've now found the particulars for all tours on the page; the last step is to instantiate
	Boostrap Tour's Tour class with the required step data, and call the start method. They take it from there.

NOTES:
- The tour will flow in the order that jQuery returns the .tourStop elements, so to control that order, you merely
	arrange your HTML appropriately. Because the targets are explicitly called out, the tour can bounce around the page
	however you like.
- The naming convention is hard-coded (tucked inside a private property of the JavaScript
	tool that runs the show). So, if you want to change them, you only have to do it once, but it does mean
	modding the source code. (Future enhancement: make these overridable.)
*/
window.bootsyTours = function() {
	// first, mod the console if my debugging enhancements aren't in place
	if (typeof window.console["dirWithMsg"] != "function") {
		window.console["dirWithMsg"] = function(message, obj, optSeverity) {
			optSeverity = optSeverity || "info";
			console[optSeverity](message + ": ");
			console.dir(obj);
		}
	}

	// private members
	// NOTE: these can be changed using the override* public methods
	var bootsyOptions = {
		wrapperSelector: ".tourStop",
		contentSelector: "aside",
		idAttribName: "tour-id",
		targetAttribName: "tour-target",
		titleAttribName: "tour-title",
		placementAttribName: "tour-placement",
		defaultTooltipTitle: "Guided Tour",
		defaultPlacement: "auto",
		clickableTargetClass: "explicitTourStep"
	}

	var componentOptions = {
		// component options apply to the plug-in tour
		// so Bootsy passed them to Bootstrap Tour as its options bag and they take it from there
		autoscroll: true,
		useBackdropEffect: false,
		storage: false
	}

	var DFLT_TOUR = "__DEFT"; // flag used internally -- I wanted to use const here but, alas, not safe yet

	var tourBag = {}; // Tour instances are collected here

	var flushTours = function() {
		tourBag = {};
	}

	var getTargetFromWrapper = function(wrapper) {
		//returns the element to which the tooltip will point visually
		var targetElem = null;
		var targetElemId = $(wrapper).attr("data-" + bootsyOptions.targetAttribName);
		if (targetElemId) {
			// standard approach
			targetElem = $("#" + targetElemId).first();
			if (targetElem.length) {
				targetElem = targetElem[0];
			}
		}
		if (!targetElem) {
			// there was either no data attribute with the target's ID, or the target itself doesn't exist, so
			// try to default it reasonably
			console.dirWithMsg("Bootsy Tours: could not resolve target; defaulting to", wrapper, "warn");
			targetElem = wrapper;
		}
		return targetElem;
	}

	var initTours = function(makeTargetsClickable) {
		if (typeof Tour != "function") {
			throw new Error("Bootsy Tours requires Bootstrap Tour: http://bootstraptour.com");
		}

		console.info("Bootsy Tours is initializing; if your naming convention fu is good, you'll have a tour soon!");

		// loop through pieces-parts
		// TODO: document what happens when there are more than one of a required child
		$(bootsyOptions.wrapperSelector).each( function(stepIndex, wrapper) {
			//get the element that owns the content
			var contentElem = $(this).find(bootsyOptions.contentSelector).first();
			if (contentElem.length < 1) {
				console.dirWithMsg("Bootsy Tours: step incomplete (no content) in", wrapper, "warn");
				return false; // breaks out of the jQuery each -- meaning if there's no content, we skip this stop
			} else {
				contentElem = contentElem[0];
			}

			//get the visible target
			var targetElem = getTargetFromWrapper(wrapper);

			//get the ID and create a new Tour, if needed
			var tourKey = $(wrapper).attr("data-" + bootsyOptions.idAttribName) || DFLT_TOUR;
			var thisTour = tourGetSet(tourKey);
			if (!thisTour) {
				// this is a tour we haven't seen yet in the initilization phase, so create and bag it
				thisTour = tourGetSet( tourKey, new Tour(componentOptions) ); // TODO: here is where Bootstrap Tour options would be passed
			}

			// now, create and push the step
			var step = {
				element: targetElem,
				placement: "bottom", // $(wrapper).attr("data-" + bootsyOptions.placementAttribName) || bootsyOptions.defaultPlacement,
				title: $(contentElem).attr("data-" + bootsyOptions.titleAttribName) || bootsyOptions.defaultTooltipTitle,
				content: $(contentElem).html(),
				backdrop: componentOptions.useBackdropEffect
			}
			// var explicitPlacement = $(wrapper).attr("data-" + bootsyOptions.placementAttribName);
			// if (explicitPlacement) {
			// 	step.placement = explicitPlacement;
			// }
			thisTour.addStep(step);

			// optionally add click handler to each target so that the tour can be started in the middle
			// -- good when there are a lot of steps so the user doesn't have to cycle thru to get to something specific
			if (makeTargetsClickable) {
				var stepCount = thisTour._options.steps.length - 1;
				$(targetElem).hover(
					function() {
						$(this).addClass(bootsyOptions.clickableTargetClass);
					}
					,
					function() {
						$(this).removeClass(bootsyOptions.clickableTargetClass);
					}
				);
				$(targetElem).click(function() {
					bootsyTours.startTour( tourKey, {stepNum: stepCount} );
				});
			}

			// the target may already be shown, but there are times when the page will want to hide these until they're
			// ready (e.g. if there is no content to go with the visible target, the target will remain hidden)
			$(targetElem).show();
		});

		// returns an object that has a function, so I can use a nifty chained-invocation pattern
		return {
			andReturn: function(tourKey) {
				return tourGetSet(tourKey);
			}
		}
	}

	var tourGetSet = function(tourKey, optSetTourTo) {
		//returns the tour at the specified key, even if it doesn't exist (undefined); optionally works as mutator
		if (typeof optSetTourTo == "object") {
			//set the value -- does not care if it's overwriting
			tourBag[tourKey] = optSetTourTo;
		}
		return tourBag[tourKey];
	}

	var getTourWithInit = function(tourKey) {
		var thisTour = tourGetSet(tourKey);
		if (!thisTour) {
			thisTour = tourGetSet(tourKey, initTours().andReturn(tourKey));
		}
		return tourBag[tourKey];
	}

	return {
		// public members
		startTour: function(tourKey, options) {
			// massage the options
			var options = options || {}

			// init the tour -- it's a no-op if this tour has been initialized already
			tour = getTourWithInit(tourKey);

			// track the event externally
			if (typeof mixpanel == "object") {
				// FIXME: having this here isn't really the right way; need to pass in a function to some options bag
				// -- also, the "Tour" prefix shouldn't be hard-coded
				try {
					mixpanel.track("Tour " + tourKey);
					console.info("Bootsy Tours tracked the tour start.");
				} catch(e) {
					console.dirWithMsg("Error when Bootsy Tours tried to track the tour start");
				}
			}

			// how we start the tour will be different depending on options
			if (options["stepNum"]) {
				// the caller has requested a non-0 step number (jumping into the middle)
				tour.restart();
				tour.goTo(options["stepNum"]);
			} else {
				// note that restart is a Bootstrap Tour concept; I want it on by default
				tour[options["noRestart"] ? "start" : "restart"]();
				tour.goTo(0); // this might be redundant but it also might be fixing odd behavior in the component
			}
		}
		,
		reset: function() {
			// clears existing state -- only needed if you're dynamically changing tour content after initialization
			flushTours();
		}
		,
		inspectTours: function() {
			console.dirWithMsg("Here are the Tours in Bootsy", tourBag);
		}
		,
		initHotspots: function() {
			initTours(true);
		}
		,
		overrideBootsyOptions: function(overrideBag) {
			$.extend(bootsyOptions, overrideBag);
		}
		,
		overrideComponentOptions: function(overrideBag) {
			$.extend(componentOptions, overrideBag);
		}
	}
}();
