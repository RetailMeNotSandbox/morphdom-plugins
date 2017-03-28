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
const transitionElementMovement = require('..').transitionElementMovement;

describe('transitionElementMovement.plugin', function () {
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
			transitionElementMovement.plugin()
		]));
		return Promise.resolve();
	};

	afterEach(()=>{
		$from.remove();
		$from = undefined;
	});

	it('throws if data-transition-motion-duration element has no id', (done)=>{
		addMarkupToDom(
			`<div>
				<div data-transition-motion="true"></div>
			</div>`
		)
		.then(_.constant(
			`<div>
				<div data-transition-motion="true"></div>
			</div>`
		))
		.then((html)=>{
			assert.throws(
				()=>{
					callMorphdom(html);
				},
				'Elements with data-transition-motion must have id to transition their movement.',
				'throws if id omitted from element with data-transition-motion'
			);
		})
		.then(done)
		.catch(done);
	});

	it('throws if data-transition-motion-duration is not specified', (done)=>{
		addMarkupToDom(
			`<div>
				<div id="test" data-transition-motion="true"></div>
			</div>`
		)
		.then(_.constant(
			`<div>
				<div id="test" data-transition-motion="true"></div>
			</div>`
		))
		.then((html)=>{
			assert.throws(
				()=>{
					callMorphdom(html);
				},
				'data-transition-motion-duration must be an integer',
				'throws if data-transition-motion-duration is omitted'
			);
		})
		.then(done)
		.catch(done);
	});

	it('does its thing', (done)=>{
		addMarkupToDom(
			`<div>
				<div id="test"
					style="width: 30px;"
					data-transition-motion="true"
					data-transition-motion-duration="100"
				></div>
			</div>`
		)
		.then(()=>{
			$from.find('#test').css({
				position: 'relative',
				top: '200px',
				left: '100px',
			});
			return Promise.delay(0);
		})
		.then(_.constant(
			`<div>
				<div id="test"
					style="width: 60px;"
					data-transition-motion="true"
					data-transition-motion-duration="100"
				>Hello</div>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			return Promise.delay(0);
		})
		.then(()=>{
			assert(
				$from.find('#test').attr('style').indexOf('transform: translate(100px, 200px)') !== -1,
				'node position should have been reset in preparation for transition'
			);
			assert(
				$from.find('#test').css('height')=== '0px',
				'node height should have been reset in preparation for transition'
			);
			assert(
				$from.find('#test').css('width')=== '30px',
				'node width should have been reset in preparation for transition'
			);
			return Promise.delay(65);
		})
		.then(()=>{
			assert(
				$from.find('#test').is('.transition-motion'),
				'`.transition-motion` class should be present'
			);
			assert(
				$from.find('#test').attr('style').indexOf('transform') === -1,
				'transform rule should have been removed from node'
			);
			assert(
				$from.find('#test').css('height') !== '0px',
				'node height should have been updated'
			);
			assert(
				$from.find('#test').css('width')=== '60px',
				'node width should have been updated'
			);
			return Promise.delay(50);
		})
		.then(()=>{
			assert(
				!$from.find('#test').is('.transition-motion'),
				'`.transition-motion` class should have been removed'
			);
		})
		.then(done)
		.catch(done);
	});

	it('honors the data-transition-motion-class attribute', (done)=>{
		addMarkupToDom(
			`<div>
				<div id="test"
					style="width: 30px;"
					data-transition-motion="true"
					data-transition-motion-duration="100"
					data-transition-motion-class="test"
				></div>
			</div>`
		)
		.then(()=>{
			$from.find('#test').css({
				position: 'relative',
				top: '200px',
				left: '100px',
			});
			return Promise.delay(0);
		})
		.then(_.constant(
			`<div>
				<div id="test"
					style="width: 60px;"
					data-transition-motion="true"
					data-transition-motion-duration="100"
				>Hello</div>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			return Promise.delay(0);
		})
		.then(()=>{
			return Promise.delay(65);
		})
		.then(()=>{
			assert(
				$from.find('#test').is('.test'),
				'`.test` class should be present'
			);
			return Promise.delay(50);
		})
		.then(()=>{
			assert(
				!$from.find('#test').is('.test'),
				'`.test` class should have been removed'
			);
		})
		.then(done)
		.catch(done);
	});

	it('honors the data-transition-motion-duration attribute', (done)=>{
		addMarkupToDom(
			`<div>
				<div id="test"
					style="width: 30px;"
					data-transition-motion="true"
					data-transition-motion-duration="300"
					data-transition-motion-class="test"
				></div>
			</div>`
		)
		.then(()=>{
			$from.find('#test').css({
				position: 'relative',
				top: '200px',
				left: '100px',
			});
			return Promise.delay(0);
		})
		.then(_.constant(
			`<div>
				<div id="test"
					style="width: 60px;"
					data-transition-motion="true"
					data-transition-motion-duration="100"
				>Hello</div>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			return Promise.delay(0);
		})
		.then(()=>{
			return Promise.delay(65);
		})
		.then(()=>{
			assert(
				$from.find('#test').is('.test'),
				'`.test` class should be present'
			);
			return Promise.delay(45);
		})
		.then(()=>{
			assert(
				$from.find('#test').is('.test'),
				'`.test` class should still be present'
			);
			return Promise.delay(200);
		})
		.then(()=>{
			assert(
				!$from.find('#test').is('.test'),
				'`.test` class should have been removed'
			);
		})
		.then(done)
		.catch(done);
	});
});
