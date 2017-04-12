'use strict';

// Motivation for transitioning positional changes inspired by
// https://medium.com/developers-writing/animating-the-unanimatable-1346a5aab3cd

var TRANSITION_ATTR = 'data-transition-motion';
var TRANSITION_MOTION_DURATION_ATTR = 'data-transition-motion-duration';
var TRANSITION_MOTION_CLASS_ATTR = 'data-transition-motion-class';
var DEFAULT_TRANSITION_MOTION_CLASS = 'transition-motion';

/**
 * Refer to the README.md for an explanation of this plugin.
 * @module transitionElementMovement
 * @return {Object} morphdom configuration that encapsulates the
 *   CSSTransitionGroup functionality
 */
module.exports.plugin = function () {
	return {
		onBeforeElUpdated: function onBeforeElUpdated(fromEl, toEl) {
			var transitionName = fromEl.getAttribute(TRANSITION_ATTR);
			if (!transitionName) {
				return toEl;
			}
			if (!fromEl.id || !toEl.id) {
				throw new Error(
					'Elements with ' +
					TRANSITION_ATTR +
					' must have id to transition their movement.'
				);
			}

			// If we've already done this once, $from.css('transform') will have
			// a value. If that is the case, we copy it from $from to $to and
			// return
			if (getTransform(fromEl)) {
				setTransform(toEl, getTransform(fromEl));
				return toEl;
			}
			var activateMotionTransitionClass = fromEl.getAttribute(TRANSITION_MOTION_CLASS_ATTR) ||
				DEFAULT_TRANSITION_MOTION_CLASS;

			var motionDuration = fromEl.getAttribute(TRANSITION_MOTION_DURATION_ATTR);
			motionDuration = parseInt(motionDuration, 10);
			if (isNaN(motionDuration)) {
				throw new Error(
					TRANSITION_MOTION_DURATION_ATTR + ' must be an integer'
				);
			}

			var previousPosition = fromEl.getBoundingClientRect();
			window.requestAnimationFrame(function () {
				// This requestAnimationFrame callback is running after
				// morphdom updated the dom nodes, but BEFORE the browser has
				// painted the change.
				var newPosition = fromEl.getBoundingClientRect();
				var deltaHeight = previousPosition.height - newPosition.height;
				var deltaWidth = previousPosition.width - newPosition.width;
				var deltaY = previousPosition.top - newPosition.top;
				var deltaX = previousPosition.left - newPosition.left;
				if (deltaX === 0 && deltaY === 0 && deltaHeight === 0 && deltaWidth === 0) {
					return;
				}

				// The CSS here is applied to $from instead of $to because toEl
				// is actually just an in-memory element that morphdom creates.
				// When it updates the dom, it actually copies the changes from
				// toEl over into fromEl and never puts the toEl instance into
				// the dom. Thus, at this point of the code execution, the state
				// of `fromEl === (the state of toEl)` when the
				// `onBeforeElUpdated` method returned.
				fromEl.style.height = previousPosition.height + 'px';
				fromEl.style.width = previousPosition.width + 'px';
				setTransform(fromEl, 'translate(' + deltaX + 'px ,' + deltaY + 'px)');
				window.requestAnimationFrame(function () {
					fromEl.classList.add(activateMotionTransitionClass);
					setTransform(fromEl, '');
					fromEl.style.height = newPosition.height + 'px';
					fromEl.style.width = newPosition.width + 'px';
					setTimeout(function () {
						fromEl.classList.remove(activateMotionTransitionClass);
						fromEl.style.height = '';
						fromEl.style.width = '';
					}, motionDuration);
				});
			});
			return toEl;
		}
	};
};

function setTransform(element, transform) {
	element.style.webkitTransform = transform;
	element.style.MozTransform = transform;
	element.style.msTransform = transform;
	element.style.OTransform = transform;
	element.style.transform = transform;
}

function getTransform(element) {
	return element.style.webkitTransform ||
		element.style.MozTransform ||
		element.style.msTransform ||
		element.style.OTransform ||
		element.style.transform || '';
}
