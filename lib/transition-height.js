'use strict';

var $ = require('jquery');

var TRANSITION_ATTR = 'data-transition-height';
var TRANSITION_TARGET_ATTR = 'data-transition-height-target';
var ELEMENT_IS_COLLAPSED_CLASS_ATTR = 'data-transition-height-collapsed-class';
var DEFAULT_ELEMENT_IS_COLLAPSED_CLASS = 'is-collapsed';

var TRANSITION_ON_ADDED_ATTR = 'data-transition-height-on-added';
var TRANSITION_ON_ADDED_DELAY = 'data-transition-height-on-added-delay';

/**
 * Refer to the README.md for an explanation of this plugin.
 * @module transitionHeight
 * @type {MorphdomPlugin}
 * @return {Object} morphdom configuration that encapsulates the ability to
 *   transition an elements height
 */
module.exports.plugin = function () {
	return {
		onNodeAdded: function onNodeAdded(el) {
			var $el = $(el);
			var transitionOnAdded = $el.attr(TRANSITION_ON_ADDED_ATTR);
			if (transitionOnAdded !== 'true') {
				var transitionName = $el.attr(TRANSITION_ATTR);
				if (transitionName !== 'true') {
					return;
				}
				var collapsedClass = $el.attr(ELEMENT_IS_COLLAPSED_CLASS_ATTR) ||
				DEFAULT_ELEMENT_IS_COLLAPSED_CLASS;
				var isOpen = !$el.hasClass(collapsedClass);
				if (isOpen) {
					var newHeight = getProperElementHeight($el);
					$el.css({
						'max-height': newHeight + 'px'
					});
				}
				return;
			}
			var transitionTimeout = $el.attr(TRANSITION_ON_ADDED_DELAY);
			transitionTimeout = transitionTimeout ?
				parseInt(transitionTimeout, 10) : 65;
			if (isNaN(transitionTimeout)) {
				throw new Error(
					TRANSITION_ON_ADDED_DELAY + ' must be an integer'
				);
			}

			// Call this function now to ensure it will not throw an error
			// after we set the timeout
			getProperElementHeight($el);
			setTimeout(function () {
				var newHeight = getProperElementHeight($el);
				$el.css({
					'max-height': newHeight + 'px'
				});
			}, transitionTimeout);
			return el;
		},
		onBeforeElUpdated: function onBeforeElUpdated(fromEl, toEl) {
			var $from = $(fromEl);
			var $to = $(toEl);
			var transitionName = $from.attr(TRANSITION_ATTR);
			if (transitionName !== 'true') {
				var transitionOnAdded = $from.attr(TRANSITION_ON_ADDED_ATTR);
				if (transitionOnAdded !== 'true') {
					return;
				}

				// if we are here, then this plugin is responsible for
				// transitioning the height fo this element when it is _added_
				// to the dom, we need to also adjust the max-height when the
				// element is updated, however we need to do so after the update
				// is applied, so that we grab the correct new height.
				// Thus, requestAnimationFrame.
				window.requestAnimationFrame(function () {
					// by the time the animation frame has been requested,
					// morphdom has applied the changes on toEl to fromEl
					// that is why we update $from here
					var newHeight = getProperElementHeight($from);
					$from.css({
						'max-height': newHeight + 'px'
					});
				});
				return toEl;
			}

			// if we are here, this plugin is responsible for assisting in
			// setting the max height when the is-collapsed class is absent from
			// the element. we do not need to requestAnimationFrame here,
			// because regardless of if $from is collapsed or not, we can grab
			// the height of its immediate child to determine the target height
			// for $to thus, we modify toEl directly before returning it to
			// morphdom
			var collapsedClass = $from.attr(ELEMENT_IS_COLLAPSED_CLASS_ATTR) ||
				DEFAULT_ELEMENT_IS_COLLAPSED_CLASS;
			var isOpen = !$to.hasClass(collapsedClass);
			if (isOpen) {
				var newHeight = getProperElementHeight($from);
				$to.css({
					'max-height': newHeight + 'px'
				});
			}
			return toEl;
		}
	};
};

module.exports.resizeHandler = function () {
	$('[' + TRANSITION_ON_ADDED_ATTR + '=true],[' + TRANSITION_ATTR + '=true]')
	.each(function (idx, el) {
		var $el = $(el);
		$el.css(
			'max-height',
			getProperElementHeight($el)
		);
	});
};

function getProperElementHeight($element) {
	var $heightTarget = $element.children(
		'[' + TRANSITION_TARGET_ATTR + '="true"]'
	);
	if ($heightTarget.length !== 1 || $element.children().length !== 1) {
		throw new Error(
			'Element with ' + TRANSITION_ATTR +
			' needs to have precisely one child with [' +
			TRANSITION_TARGET_ATTR + '="true"]'
		);
	}
	return $heightTarget.outerHeight();
}
