'use strict';

// Motivation for transitioning positional changes inspired by
// https://medium.com/developers-writing/animating-the-unanimatable-1346a5aab3cd

var $ = require('jquery');

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
			var $from = $(fromEl);
			var $to = $(toEl);
			var transitionName = $from.attr(TRANSITION_ATTR);
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
			if ($from.css('transform') !== 'none') {
				$to.css({
					transform: $from.css('transform')
				});
				return toEl;
			}
			var activateMotionTransitionClass = $from.attr(TRANSITION_MOTION_CLASS_ATTR) ||
				DEFAULT_TRANSITION_MOTION_CLASS;

			var motionDuration = $from.attr(TRANSITION_MOTION_DURATION_ATTR);
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
				$from.css({
					height: previousPosition.height,
					width: previousPosition.width,
					transform: 'translate(' + deltaX + 'px ,' +
						deltaY + 'px)'
				});
				window.requestAnimationFrame(function () {
					$from.addClass(activateMotionTransitionClass);
					$from.css({
						transform: '',
						height: newPosition.height,
						width: newPosition.width
					});
					setTimeout(function () {
						$from.removeClass(activateMotionTransitionClass);
						$from.css({
							height: '',
							width: ''
						});
					}, motionDuration);
				});
			});
			return toEl;
		}
	};
};
