'use strict';

var Element = window.Element;

// @source: MDN
if (!Element.prototype.matches) {
	Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function (s) {
			var matches = (this.document || this.ownerDocument).querySelectorAll(s),
				i = matches.length;
			while (--i >= 0 && matches.item(i) !== this) {}
			return i > -1;
		};
}

/**
 * There exists a possible race condition where the following conditions are
 * true:
 *
 *  1. the user has updated the value in the field, triggering a keyup event
 *  2. the keyup event handler has not yet executed, and thus the new value as
 *     typed by the user has not been reduced into the state
 *  3. separately, some other (async) action alters the state, triggering a re-
 *     render
 *
 * If the re-render from (3) runs before the keyup listener dispatches an action
 * with the new value in step (2), then the following problem exists: The
 * input's value is overwritten with the stale value in the redux store. The
 * keyup handler then runs and grabs this old value, dispatching an action as
 * though it were the new value. The race condition described above is accounted
 * for and resolved by returning false if the input has focus.
 *
 * This solution does not account for cases where the value driving the text
 * input may have changed due to some non-user interaction (such as new data
 * coming back from an endpoint). If such a case arises, a good UX would be to
 * notify the user that the page is stale, and offer a button for updating its
 * contents.
 *
 * Refer to the README.md for usage details and a deeper explanation of this
 * plugin.
 * @module inputPersistence
 * @type {MorphdomPlugin}
 * @return {Object} morphdom configuration that encapsulates the ability to not
 *   update an text element that has user-focus
 */
module.exports.plugin = function () {
	return {
		onBeforeElUpdated: function (el) {
			return !el.matches('input[type=text]:focus,input[type=number]:focus');
		}
	};
};
