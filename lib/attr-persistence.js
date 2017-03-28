'use strict';

var $ = require('jquery');

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
	var $from = $(fromEl);
	var attr = 'data-persist-' + type;
	var toPersist = $from.attr(attr);
	if (!toPersist) {
		return toEl;
	}
	toPersist = toPersist.split(',');
	var $to = $(toEl);
	for (var i = 0; i < toPersist.length; i++) {
		var curClass = toPersist[i];
		switch (type) {
		case 'class':
			$to.toggleClass(toPersist[i], $from.hasClass(curClass));
			break;
		case 'css':
			// Avoid persisting styles that are computed and not strictly
			// defined on the style attribute
			if ($from.get(0).style[$.camelCase(curClass)]) {
				$to.css(curClass, $from.css(curClass));
			}
			break;
		default:
			throw new Error('unsupported type ' + type);
		}
	}
	return toEl;
}
