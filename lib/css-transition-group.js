'use strict';

var TRANSITION_ATTR = 'data-transition-name';
var TRANSITION_ENTER_ATTR = 'data-transition-enter';
var TRANSITION_LEAVE_ATTR = 'data-transition-leave';
var TRANSITION_ENTER_DELAY_ATTR = 'data-transition-enter-delay';
var TRANSITION_ENTER_DURATION_ATTR = 'data-transition-enter-duration';
var TRANSITION_LEAVE_DELAY_ATTR = 'data-transition-leave-delay';
var TRANSITION_LEAVE_DURATION_ATTR = 'data-transition-leave-duration';
var ENTER_SUFFIX = '-enter';
var LEAVE_SUFFIX = '-leave';
var ACTIVE_SUFFIX = '-active';
var COMPLETE_SUFFIX = '-complete';

/**
 * Refer to the README.md for an explanation of this plugin.
 * @module cssTransitionGroup
 * @type {MorphdomPlugin}
 * @return {Object} morphdom configuration that encapsulates the
 *   CSSTransitionGroup functionality
 */
module.exports.plugin = function () {
	return {
		onBeforeNodeAdded: onBeforeNodeAdded,
		onBeforeNodeDiscarded: onBeforeNodeDiscarded,

		// Since transitions live outside of redux, and thus are not reflected
		// in the re-rendering of a template, we need to copy over the
		// transition class from fromEl to toEl before updating the dom.
		onBeforeElUpdated: onBeforeElUpdated
	};
};

/**
 * Get the attr from $node and parse it as an integer. Throws an error of the
 * value of the specified attribute does not parse as an integer.
 * @memberOf cssTransitionGroup
 * @param  {String} attr  name of attribute from which to fetch an integer.
 * @param  {Element} node jQuery collection containing the node in question.
 * @return {Number}       number representing the value of the attr for the
 *   $node
 */
function getTransitionTimeout(attr, node, defaultDuration) {
	if (typeof defaultDuration === 'undefined') {
		defaultDuration = NaN;
	}
	var transitionTimeout = node.getAttribute(attr);
	transitionTimeout = transitionTimeout ? parseInt(transitionTimeout, 10) : defaultDuration;
	if (isNaN(transitionTimeout)) {
		var e = Error(attr + ' must be an integer');
		e.forNode = node;
		throw e;
	}
	return transitionTimeout;
}

function onBeforeNodeAdded(node) {
	var transitionName = node.getAttribute && node.getAttribute(TRANSITION_ATTR);
	if (!transitionName) {
		return node;
	}
	var transitionIsEnabled = node.getAttribute(TRANSITION_ENTER_ATTR);
	if (transitionIsEnabled === 'false') {
		return;
	}
	var transitionEnterTimeout = getTransitionTimeout(
		TRANSITION_ENTER_DELAY_ATTR, node, 65
	);
	var transitionDuration = getTransitionTimeout(
		TRANSITION_ENTER_DURATION_ATTR, node
	);

	node.classList.add(transitionName + ENTER_SUFFIX);
	function applyEnterTransition() {
		node.classList.add(transitionName + ENTER_SUFFIX + ACTIVE_SUFFIX);
		setTimeout(function () {
			node.classList.remove(transitionName + ENTER_SUFFIX);
			node.classList.remove(transitionName + ENTER_SUFFIX + ACTIVE_SUFFIX);
			dispatchEvent(node, transitionName + ENTER_SUFFIX + COMPLETE_SUFFIX);
		}, transitionDuration);
	}
	setTimeout(applyEnterTransition, transitionEnterTimeout);
	return node;
}

function onBeforeNodeDiscarded(node) {
	var transitionName = node.getAttribute && node.getAttribute(TRANSITION_ATTR);
	if (!transitionName) {
		return true;
	}
	var transitionIsEnabled = node.getAttribute(TRANSITION_LEAVE_ATTR);
	if (transitionIsEnabled === 'false') {
		return true;
	}
	var transitionLeaveTimeout = getTransitionTimeout(
		TRANSITION_LEAVE_DELAY_ATTR, node, 65
	);
	var transitionDuration = getTransitionTimeout(
		TRANSITION_LEAVE_DURATION_ATTR, node
	);

	node._totalDuration = transitionLeaveTimeout + transitionDuration;
	node._leaveStart = new Date().getTime();
	node.classList.add(transitionName + LEAVE_SUFFIX);
	clearTimeout(node._leaveTimeout);
	node._leaveTimeout = setTimeout(applyLeaveTransition, transitionLeaveTimeout);
	function applyLeaveTransition() {
		node.classList.add(transitionName + LEAVE_SUFFIX + ACTIVE_SUFFIX);
		node._leaveTimeout = setTimeout(handleLeaveTransitionComplete, transitionDuration);
	}
	function handleLeaveTransitionComplete() {
		node._leaveTimeout = null;
		dispatchEvent(node, transitionName + LEAVE_SUFFIX + COMPLETE_SUFFIX);
		node.parentNode.removeChild(node);
	}
	return false;
}

function onBeforeElUpdated(fromEl, toEl) {
	var transitionName = fromEl.getAttribute && fromEl.getAttribute(TRANSITION_ATTR);
	if (!transitionName) {
		return toEl;
	}

	// If a node is updated while we are transitioning it out of view,
	// we can assume this means the state has changed such that the node
	// is now intended to be in the dom. Cancel and reverse the exit transition.
	if (fromEl._leaveTimeout) {
		fromEl._leaveTimeout = clearTimeout(fromEl._leaveTimeout);
		fromEl.classList.add(transitionName + LEAVE_SUFFIX);
		fromEl.classList.remove(transitionName + LEAVE_SUFFIX + ACTIVE_SUFFIX);
		var remaining = fromEl._totalDuration - (new Date().getTime() - fromEl._leaveStart);
		fromEl._leaveTimeout = setTimeout(function () {
			fromEl.classList.remove(transitionName + LEAVE_SUFFIX);
		}, remaining);
	}
	var transitionClassesToPersist = [
		transitionName + ENTER_SUFFIX,
		transitionName + ENTER_SUFFIX + ACTIVE_SUFFIX,
		transitionName + LEAVE_SUFFIX,
		transitionName + LEAVE_SUFFIX + ACTIVE_SUFFIX
	];
	for (var i = 0; i < transitionClassesToPersist.length; i++) {
		var name = transitionClassesToPersist[i];
		if (fromEl.classList.contains(name)) {
			toEl.classList.add(name);
		} else {
			toEl.classList.remove(name);
		}
	}
	return toEl;
}

function dispatchEvent(node, event) {
	var evt;
	try {
		evt = new Event(event, {bubbles: true});
	} catch (e) {
		evt = document.createEvent('Event');
		evt.initEvent(event, true, true);
	}
	node.dispatchEvent(evt);
}
