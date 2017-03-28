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
const transitionHeight = require('..').transitionHeight;

describe('transitionHeight.plugin', function () {
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
			transitionHeight.plugin()
		]));
		return Promise.resolve();
	};

	afterEach(()=>{
		$from.remove();
		$from = undefined;
	});

	it('transitions the height of elements that are added to the dom', (done)=>{
		addMarkupToDom(`<div></div>`)
		.then(_.constant(
			`<div>
				<div id="test"
					data-transition-height-on-added="true"
					data-transition-height-on-added-delay="10"
				>
					<div data-transition-height-target="true">
						Hello.
					</div>
				</div>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			var $node = $from.find('#test');
			var maxHeight = $node.get(0).style['max-height'];
			assert(
				maxHeight === '',
				'max-height should not yet have been set'
			);
			return Promise.delay(10);
		})
		.then(()=>{
			var $node = $from.find('#test');
			var maxHeight = $node.get(0).style['max-height'];
			assert(
				maxHeight !== '',
				'max-height should have been set to height of content'
			);
		})
		.then(done)
		.catch(done);
	});

	it('honors transition-height-on-added-delay', (done)=>{
		addMarkupToDom(`<div></div>`)
		.then(_.constant(
			`<div>
				<div id="test"
					data-transition-height-on-added="true"
					transition-height-on-added-delay="100"
				>
					<div data-transition-height-target="true">
						Hello.
					</div>
				</div>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			var $node = $from.find('#test');
			var maxHeight = $node.get(0).style['max-height'];
			assert(
				maxHeight === '',
				'max-height should not yet have been set'
			);
			return Promise.delay(10);
		})
		.then(()=>{
			var $node = $from.find('#test');
			var maxHeight = $node.get(0).style['max-height'];
			assert(
				maxHeight === '',
				'max-height should still not yet have been set'
			);
			return Promise.delay(90);
		})
		.then(()=>{
			var $node = $from.find('#test');
			var maxHeight = $node.get(0).style['max-height'];
			assert(
				maxHeight !== '',
				'max-height should have been set to height of content'
			);
		})
		.then(done)
		.catch(done);
	});

	it('throws if data-transition-height-on-added-delay is not a number', (done)=>{
		addMarkupToDom(`<div></div>`)
		.then(()=>{
			return Promise.delay(10);
		})
		.then(_.constant(
			`<div>
				<div id="test"
					data-transition-height-on-added="true"
					data-transition-height-on-added-delay="true"
				>
					Hello.
				</div>
			</div>`
		))
		.then((html)=>{
			assert.throws(
				()=>{
					callMorphdom(html);
				},
				'data-transition-height-on-added-delay must be an integer',
				'throws if data-transition-height-on-added-delay is not an integer'
			);
		})
		.then(done)
		.catch(done);
	});

	it('throws if data-transition-height-target is not a child of the added node', (done)=>{
		addMarkupToDom(`<div></div>`)
		.then(()=>{
			return Promise.delay(10);
		})
		.then(_.constant(
			`<div>
				<div id="test"
					data-transition-height-on-added="true"
				>
					Hello.
				</div>
			</div>`
		))
		.then((html)=>{
			assert.throws(
				()=>{
					callMorphdom(html);
				},
				'Element with data-transition-height needs to have precisely one child with [data-transition-height-target="true"]',
				'throws if data-transition-height-target=true child is missing'
			);
		})
		.then(done)
		.catch(done);
	});

	it('transitions the height of elements', (done)=>{
		addMarkupToDom(
			`<div>
				<div id="test"
					data-transition-height="true"
				>
					<div data-transition-height-target="true">
						Hello.
					</div>
				</div>
				<div id="test2"
					class="has-been-collapsed"
					data-transition-height-collapsed-class="has-been-collapsed"
					data-transition-height="true"
				>
					<div data-transition-height-target="true">
						Hello.
					</div>
				</div>
			</div>`
		)
		.then(_.constant(
			`<div>
				<div id="test"
					data-transition-height="true"
					class="is-collapsed"
				>
					<div data-transition-height-target="true">
						Hello.
					</div>
				</div>
				<div id="test2"
					data-transition-height="true"
					data-transition-height-collapsed-class="has-been-collapsed"
				>
					<div data-transition-height-target="true">
						Hello.
					</div>
				</div>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			var $node = $from.find('#test');
			var maxHeight = $node.get(0).style['max-height'];
			assert(
				maxHeight === '',
				'max-height should have already been cleared'
			);
			var $node2 = $from.find('#test2');
			var maxHeight2 = $node2.get(0).style['max-height'];
			assert(
				maxHeight2 !== '',
				'max-height should have been set on expanding node'
			);
			return Promise.delay(10);
		})
		.then(done)
		.catch(done);
	});
});
