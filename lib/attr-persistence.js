'use strict';

var camelCase = require('camelcase');

/**
 * Helps persist class names or css rules across calls to morphdom.
 * Refer to the README.md for usage details and a deeper explanation of this
 * plugin.
 * @module attrPersistence
 * @type {MorphdomPlugin}
 * @return {Object} morphdom configuration that encapsulates the ability to
 *   persist classes or css rules across morphdom calls
 */
module.exports.plugin = function () {
	return {
		onBeforeElUpdated: function (fromEl, toEl) {
			toEl = persistAttr(fromEl, toEl, 'class');
			return persistAttr(fromEl, toEl, 'css');
		}
	};
};

function persistAttr(fromEl, toEl, type) {
	if (type !== 'class' && type !== 'css') {
		throw new Error('unsupported type ' + type);
	}
	var attr = 'data-persist-' + type;
	var toPersist = fromEl.getAttribute(attr);
	if (!toPersist) {
		return toEl;
	}
	toPersist = toPersist.split(',');
	for (var i = 0; i < toPersist.length; i++) {
		var curClass = toPersist[i];
		switch (type) {
		case 'class':
			if (fromEl.classList.contains(curClass)) {
				toEl.classList.add(toPersist[i]);
			} else {
				toEl.classList.remove(toPersist[i]);
			}
			break;
		case 'css':
			// Avoid persisting styles that are computed and not strictly
			// defined on the style attribute
			var style = camelCase(curClass);
			if (fromEl.style[style]) {
				toEl.style[style] = fromEl.style[style];
			}
			break;
		default:
			throw new Error('unsupported type ' + type);
		}
	}
	return toEl;
}
