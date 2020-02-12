// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// IMPORTANT: this also uses window.console.dirWithMsg, a really helpful bit of console sugar
// I've been using for years. This will create that function if needed.
// There should be no harmful side effects.

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

	var DFLT_TOUR = "__DEFT"; // flag used internally

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
		// -- note that this doesn't try to gracefully handle situations where you have
		//    more than one of a required child in your HTML
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
				thisTour = tourGetSet( tourKey, new Tour(componentOptions) ); // here is where Bootstrap Tour options would be passed
			}

			// now, create and push the step
			var step = {
				element: targetElem,
				placement: "bottom",
				title: $(contentElem).attr("data-" + bootsyOptions.titleAttribName) || bootsyOptions.defaultTooltipTitle,
				content: $(contentElem).html(),
				backdrop: componentOptions.useBackdropEffect
			}
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
			// you can call this directly from the console to dump out some state
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
