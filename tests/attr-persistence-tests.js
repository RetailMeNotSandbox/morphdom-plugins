'use strict';
const $ = require('jquery');
const _ = require('lodash');
const chai = require('chai');
const Promise = require('bluebird');
const sinon = require('sinon');

const assert = chai.assert;

const morphdom = require('morphdom');
const morphdomPlugins = require('..');
const applyMorphdomPlugins = morphdomPlugins.applyMorphdomPlugins;
const attrPersistence = require('..').attrPersistence;

describe('attrPersistence.plugin', function () {
	let $from;
	const addMarkupToDom = (markup)=>{
		var $markup = $(markup);
		$markup.appendTo('body');
		$from = $markup;
		return Promise.resolve();
	};

	const callMorphdom = (newMarkup)=>{
		if (!$from) {
			throw new Error('Nothing to do without $from');
		}
		morphdom($from.get(0), newMarkup, applyMorphdomPlugins([
			attrPersistence.plugin()
		]));
		return Promise.resolve();
	};

	afterEach(()=>{
		$from.remove();
		$from = undefined;
	});

	it('persists the state of classes', (done)=>{
		// Test that the class remains present even if missing from re-render
		addMarkupToDom(
			'<div id="a" class="test" data-persist-class="test"></div>'
		)
		.then(_.constant('<div id="a" data-persist-class="test"></div>'))
		.then(callMorphdom)
		.then(()=>{
			assert(
				$from.hasClass('test'),
				'node should have been updated with the `test` class'
			);
		})

		// Test that the class remains absent even if present from re-render
		.then(()=>{
			$from.removeClass('test');
		})
		.then(_.constant('<div id="a" class="test" data-persist-class="test"></div>'))
		.then(callMorphdom)
		.then(()=>{
			assert(
				!$from.hasClass('test'),
				'node should not have been updated with the `test` class'
			);
		})
		.then(done)
		.catch(done);
	});

	it('persists css rules', (done)=>{
		addMarkupToDom(
			'<div id="a" data-persist-css="height" style="height: 20px"></div>'
		)
		.then(_.constant('<div id="a" data-persist-css="height"></div>'))
		.then(callMorphdom)
		.then(()=>{
			assert.equal(
				$from.css('height'),
				'20px'
			);
		})
		.then(done)
		.catch(done);
	});

	it('does not persist computed css properties', (done)=>{
		addMarkupToDom(
			'<div id="a" data-persist-css="height"></div>'
		)
		.then(_.constant('<div id="a" data-persist-css="height"></div>'))
		.then(callMorphdom)
		.then(()=>{
			assert.equal(
				$from.attr('style'),
				undefined
			);
		})
		.then(done)
		.catch(done);
	});
});
