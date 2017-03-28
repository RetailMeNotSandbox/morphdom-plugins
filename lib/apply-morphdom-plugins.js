'use strict';

module.exports = applyMorphdomPlugins;

/**
 * Combines morphdom configs for plugins with an (optional) base morphdom
 * config and returns a composite morphdom config that will walk through the
 * configured methods for the base config and each plugin in order.
 * @module applyMorphdomPlugins
 * @type {Function}
 * @param  {Object[]} pluginsConfig  Array of morphdom configurations returned
 *   from plugins
 * @param  {Object} [morphdomConfig] Base morphdom configuration
 * @return {Object} a version of `morphdomConfig` that will run the plugin code
 *   in order.
 * @throws {Error} If any plugin specifies config for `getNodeKey`
 * @throws {Error} If any plugin specifies config for `childrenOnly`
 */
function applyMorphdomPlugins(pluginsConfig, morphdomConfig) {
	morphdomConfig = morphdomConfig || {};
	if (typeof morphdomConfig !== 'object') {
		throw new Error(
			'config passed to applyMorphdomPlugins must be ' +
			'an object'
		);
	}

	// Copy morphdomConfig so as to not mutate it before returning
	var i;
	var retVal = {};
	var keys = Object.keys(morphdomConfig);
	for (i = 0; i < keys.length; i++) {
		retVal[keys[i]] = morphdomConfig[keys[i]];
	}

	// Loop over all of the plugins and apply them to the retVal
	for (i = 0; i < pluginsConfig.length; i++) {
		retVal = applyMorphdomPlugin(pluginsConfig[i], retVal);
	}
	return retVal;
}

/**
 * Singular version of applyMorphdomPlugins that accepts a single pluginConfig
 *   instead of an array.
 * @param  {Object} pluginConfig   morphdom configuration for a plugin
 * @param  {Object} morphdomConfig base morphdom configuration
 * @return {Object}                a composed morphdom config that will evaluate
 *   the code for both the pluginConfig and morphdomConfig when the callback
 *   is invoked
 */
function applyMorphdomPlugin(pluginConfig, morphdomConfig) {
	var keys = Object.keys(pluginConfig);
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		morphdomConfig[key] = getWrappedMorphdomMethod(
			pluginConfig,
			morphdomConfig,
			key
		);
	}
	return morphdomConfig;
}

/**
 * @typedef {Function} MorphdomPlugin  A morphdom configuration encapsulating
 * the code for a given set of functionality.
 * @returns {Object} a morphdom configuration encapsulating the code for your
 *   plugin
 */

/**
 * @typedef {Function} WrappedMorphdomMethod  represents a wrapped morphdom
 * method that acts as the middleware runner for a given morphdom callback
 * method. Objects of this type should be functions that return functions that
 * evaluate two corresponding morphdom methods. The outer function will be
 * passed three arguments: `originalMethod`, `pluginMethod`, and `key`. The
 * WrappedMorphdomMethod should invoke `originalMethod` first, and depending
 * on its return value, invoke `pluginMethod`. It should return logically and
 * short-circuit the call to `pluginMethod` when appropriate.
 * @type {Function}
 * @param {Function} [originalMethod] The original method to invoke. Depending
 *   on its return, the pluginMethod will be invoked after. The arguments will
 *   be proxied to pluginMethod as appropriate. (this varies depending on
 *   the function signature of the morphdom method in question)
 * @param {Function} pluginMethod The pluginMethod to invoke if the
 *   originalMethod's return allows it.
 * @param {String} key string representing the method that is wrapped by the
 *   returned morphdom method
 */

/**
 * Map of keys accepted by morphdom as config, to the WrappedMorphdomMethod
 * that is capable of composing two versions of the morphdom method named by
 * the key.
 * @type {Object}
 */
var MORPHDOM_METHOD_MAP = {

	// (Function(node)) - Called before a
	// Node in the to tree is added to the from tree. If this function returns
	// false then the node will not be added. Should return the node to be
	// added.
	onBeforeNodeAdded: wrappedOnBeforeNodeAdded,

	// (Function(fromEl, toEl)) - Called before a HTMLElement in the from tree
	// is updated. If this function returns false then the element will not be
	// updated.
	onBeforeElUpdated: wrappedOnBeforeElUpdated,

	// (Function(fromEl, toEl)) - Called before the children of a HTMLElement
	// in the from tree are updated. If this function returns false then
	// the child nodes will not be updated.
	/* falls through */
	onBeforeElChildrenUpdated: wrappedBooleanReturningMethod,

	// (Function(node)) - Called before a Node in
	// the from tree is discarded. If this function returns false then the node
	// will not be discarded.
	onBeforeNodeDiscarded: wrappedBooleanReturningMethod,

	// (Function(fromEl, toEl)) - Called before the children of a HTMLElement in
	// the from tree are updated.
	onNodeDiscarded: wrappedNothingReturningMethod,

	// (Function(node)) - Called after a Node in the to tree
	// has been added to the from tree.
	onNodeAdded: wrappedNothingReturningMethod,

	// (Function(el)) - Called after a HTMLElement in the from tree
	// has been updated.
	onElUpdated: wrappedNothingReturningMethod,

	// The following two methods are unsupported. An error will be thrown if they
	// are specified by a pluginConfig
	// This is unsupported because the node key is a unique ID. How this would
	// get specified by multiple plugins is not well defined, thus its use is
	// totally disallowed.
	getNodeKey: false,

	// This is unsupported because it is a boolean configuration flag. The user
	// calling morphdom should determine the value of this config, not the
	// plugins.
	childrenOnly: false
};

/**
 * Returns an entry from `MORPHDOM_METHOD_MAP` corresponding to `key`.
 * @throws {Error} If the value of `key` in `MORPHDOM_METHOD_MAP` is undefined.
 * @param  {Object} pluginConfig   morphdom config for the plugin
 * @param  {Object} morphdomConfig morphdom config that should be evaluated
 *   before the morphdom config specified in the plugin
 * @param  {String} key  indicates the name of the desired morphdom method
 * @return {WrappedMorphdomMethod} Returns a method that composes
 *   morphdomConfig and pluginConfig and returns a method that can represent
 *   any of the morphdom config callback methods.
 */
function getWrappedMorphdomMethod(pluginConfig, morphdomConfig, key) {
	if (!MORPHDOM_METHOD_MAP[key]) {
		throw new Error('You can not create a plugin that wraps ' + key + '.');
	}
	var originalMethod = morphdomConfig[key];
	var pluginMethod = pluginConfig[key];
	return MORPHDOM_METHOD_MAP[key](originalMethod, pluginMethod, key);
}

/**
 * `WrappedMorhpdomMethod` implementation for `onBeforeNodeAdded`
 * @type {WrappedMorphdomMethod}
 * @return {Function} composed morphdom method that will invoke both
 *   `originalMethod` and `pluginMethod`'s code when it executes
 */
function wrappedOnBeforeNodeAdded(originalMethod, pluginMethod, key) {
	return function (node) {
		if (originalMethod) {
			var newToEl = originalMethod(node);
			if (newToEl === false) {
				return newToEl;
			}
			if (newToEl === true) {
				return pluginMethod(node);
			}
			if (typeof newToEl === 'undefined') {
				throw new Error(
					'You must return a boolean, or the element to be ' +
					'updated from ' + key
				);
			}
			return pluginMethod(newToEl);
		}
		return pluginMethod(node);
	};
}

/**
 * `WrappedMorhpdomMethod` implementation for `wrappedOnBeforeElUpdated`
 * @type {WrappedMorphdomMethod}
 * @return {Function} composed morphdom method that will invoke both
 *   `originalMethod` and `pluginMethod`'s code when it executes
 */
function wrappedOnBeforeElUpdated(originalMethod, pluginMethod, key) {
	return function () {
		if (originalMethod) {
			var newToEl = originalMethod.apply(null, arguments);
			if (newToEl === false) {
				return newToEl;
			}
			if (newToEl === true) {
				return pluginMethod.apply(null, arguments);
			}
			if (typeof newToEl === 'undefined') {
				throw new Error(
					'You must return a boolean, or the element to be ' +
					'updated from ' + key
				);
			}
			return pluginMethod(arguments[0], newToEl);
		}
		return pluginMethod.apply(null, arguments);
	};
}

/**
 * `WrappedMorhpdomMethod` implementation for methods that morphdom expects to
 * return a boolean. This method will only invoke `pluginMethod` if
 * `originalMethod` did not return `false`.
 * @type {WrappedMorphdomMethod}
 * @return {Function} composed morphdom method that will invoke both
 *   `originalMethod` and `pluginMethod`'s code when it executes
 */
function wrappedBooleanReturningMethod(originalMethod, pluginMethod) {
	return function () {
		if (originalMethod) {
			var originalReturn = originalMethod.apply(null, arguments);
			if (originalReturn === false) {
				return originalReturn;
			}
		}
		return pluginMethod.apply(null, arguments);
	};
}

/**
 * `WrappedMorhpdomMethod` implementation for methods that morphdom expects
 * to return anything. This method will always invoke both `originalMethod` and
 * `pluginMethod`
 * @type {WrappedMorphdomMethod}
 * @return {Function} composed morphdom method that will invoke both
 *   `originalMethod` and `pluginMethod`'s code when it executes
 */
function wrappedNothingReturningMethod(originalMethod, pluginMethod) {
	return function () {
		if (originalMethod) {
			originalMethod.apply(null, arguments);
		}
		pluginMethod.apply(null, arguments);
		return;
	};
}
