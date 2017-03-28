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
const cssTransitionGroup = require('..').cssTransitionGroup;

describe('cssTransitionGroup.plugin', function () {
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
			cssTransitionGroup.plugin()
		]));
		return Promise.resolve();
	};

	afterEach(()=>{
		$from.remove();
		$from = undefined;
	});

	it('throws if data-transition-enter-duration is not specified', (done)=>{
		addMarkupToDom('<div></div>')
		.then(()=>{
			assert.throws(
				()=>{
					callMorphdom(
						`<div>
							<span id="test1" data-transition-name="test1"></span>
						</div>`
					);
				},
				'data-transition-enter-duration must be an integer',
				'should throw if data-transition-enter-duration is not specified'
			);
		})
		.then(done)
		.catch(done);
	});

	it('throws if data-transition-leave-duration is not specified', (done)=>{
		addMarkupToDom(
			`<div>
				<span id="test2" data-transition-name="test1" data-transition-enter-duration="0"></span>
			</div>`
		)
		.then(()=>{
			assert.throws(
				()=>{
					callMorphdom('<div></div>');
				},
				'data-transition-leave-duration must be an integer',
				'should throw if data-transition-leave-duration is not specified'
			);
		})
		.then(done)
		.catch(done);
	});

	it('applies the enter transition classes correctly', (done)=>{
		const enterDelay = 10;
		addMarkupToDom('<div></div>')
		.then(_.constant(
			`<div>
				<span id="test1" data-transition-name="test1" data-transition-enter-duration="${enterDelay}"></span>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-enter'),
				'`.test1-enter` class should be present'
			);
			assert(
				!$from.find('#test1').is('.test1-enter-active'),
				'`.test1-enter-active` class should not yet be present'
			);
			return Promise.delay(65);
		})
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-enter.test1-enter-active'),
				'`.test1-enter.test1-enter-active` class should now be active'
			);
			return Promise.delay(enterDelay);
		})
		.then(()=>{
			assert(
				!$from.find('#test1').is('.test1-enter'),
				'`.test1-enter` class should no longer be active'
			);
			assert(
				!$from.find('#test1').is('.test1-enter-active'),
				'`.test1-enter-active` class should no longer be active'
			);
		})
		.then(done)
		.catch(done);
	});

	it('honors data-transition-enter="false"', (done)=>{
		const enterDelay = 10;
		addMarkupToDom('<div></div>')
		.then(_.constant(
			`<div>
				<span id="test1"
					data-transition-enter="false"
					data-transition-name="test1"
					data-transition-enter-duration="${enterDelay}"></span>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			assert(
				!$from.find('#test1').is('.test1-enter'),
				'`.test1-enter` class should not be present'
			);
			assert(
				!$from.find('#test1').is('.test1-enter-active'),
				'`.test1-enter-active` class should not yet be present'
			);
			return Promise.delay(65);
		})
		.then(()=>{
			assert(
				!$from.find('#test1').is('.test1-enter.test1-enter-active'),
				'`.test1-enter.test1-enter-active` class should not be active'
			);
		})
		.then(done)
		.catch(done);
	});

	it('honors data-transition-enter-delay', (done)=>{
		const enterDelay = 300;
		addMarkupToDom('<div></div>')
		.then(_.constant(
			`<div>
				<span id="test1"
				data-transition-name="test1"
				data-transition-enter-duration="${enterDelay}"
				data-transition-enter-delay="100"
			></span>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-enter'),
				'`.test1-enter` class should be present'
			);
			assert(
				!$from.find('#test1').is('.test1-enter-active'),
				'`.test1-enter-active` class should not yet be present'
			);
			return Promise.delay(50);
		})
		.then(()=>{
			assert(
				!$from.find('#test1').is('.test1-enter.test1-enter-active'),
				'`.test1-enter.test1-enter-active` class should still not be present'
			);
			return Promise.delay(70);
		})
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-enter.test1-enter-active'),
				'`.test1-enter.test1-enter-active` class should now be active'
			);
			return Promise.delay(enterDelay);
		})
		.then(()=>{
			assert(
				!$from.find('#test1').is('.test1-enter'),
				'`.test1-enter` class should no longer be active'
			);
			assert(
				!$from.find('#test1').is('.test1-enter-active'),
				'`.test1-enter-active` class should no longer be active'
			);
		})
		.then(done)
		.catch(done);
	});

	it('triggers an event when the enter transition is complete', (done)=>{
		$(document).on('test1-enter-complete', '#test1', ()=>{
			$(document).off('test1-enter-complete');
			done();
		});
		addMarkupToDom('<div></div>')
		.then(_.constant(
			`<div>
				<span id="test1"
				data-transition-name="test1"
				data-transition-enter-duration="100"
				data-transition-enter-delay="100"
			></span>
			</div>`
		))
		.then(callMorphdom)
		.catch(done);
	});

	it('triggers an event when the leave transition is complete', (done)=>{
		$(document).on('test1-leave-complete', '#test1', ()=>{
			$(document).off('test1-leave-complete');
			done();
		});
		addMarkupToDom(
			`<div>
				<span id="test1"
				data-transition-name="test1"
				data-transition-leave-duration="100"
				data-transition-leave-delay="100"
			></span>
			</div>`
		)
		.then(_.constant('<div></div>'))
		.then(callMorphdom)
		.catch(done);
	});

	it('honors data-transition-leave="false"', (done)=>{
		const enterDelay = 10;
		addMarkupToDom(
			`<div>
				<span id="test1"
					data-transition-leave="false"
					data-transition-name="test1"
			</div>`
		)
		.then(_.constant(
			'<div></div>'
		))
		.then(callMorphdom)
		.then(()=>{
			return Promise.delay(10);
		})
		.then(()=>{
			assert(
				!$from.find('#test1').length,
				'`node should already be gone'
			);
		})
		.then(done)
		.catch(done);
	});

	it('applies the leave trransition classes correctly', (done)=>{
		const leaveDuration = 10;
		addMarkupToDom(
			`<div>
				<span id="test1" data-transition-name="test1" data-transition-leave-duration="${leaveDuration}"></span>
			</div>`)
		.then(_.constant(
			'<div></div>'
		))
		.then(callMorphdom)
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-leave'),
				'`.test1-leave` class should be present'
			);
			assert(
				!$from.find('#test1').is('.test1-leave-active'),
				'`.test1-leave-active` class should not yet be present'
			);
			return Promise.delay(65);
		})
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-leave.test1-leave-active'),
				'`.test1-leave.test1-leave-active` class should now be active'
			);
			return Promise.delay(leaveDuration);
		})
		.then(()=>{
			assert(
				!$from.find('#test1').length,
				'`#test1` element should be removed'
			);
		})
		.then(done)
		.catch(done);
	});

	it('honors the data-transition-leave-delay', (done)=>{
		const leaveDuration = 10;
		addMarkupToDom(
			`<div>
				<span id="test1"
					data-transition-name="test1"
					data-transition-leave-duration="${leaveDuration}"
					data-transition-leave-delay="100"
				></span>
			</div>`)
		.then(_.constant(
			'<div></div>'
		))
		.then(callMorphdom)
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-leave'),
				'`.test1-leave` class should be present'
			);
			assert(
				!$from.find('#test1').is('.test1-leave-active'),
				'`.test1-leave-active` class should not yet be present'
			);
			return Promise.delay(50);
		})
		.then(()=>{
			assert(
				!$from.find('#test1').is('.test1-leave-active'),
				'`.test1-leave-active` class should still not be present'
			);
			return Promise.delay(50);
		})
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-leave.test1-leave-active'),
				'`.test1-leave.test1-leave-active` class should now be active'
			);
			return Promise.delay(leaveDuration);
		})
		.then(()=>{
			assert(
				!$from.find('#test1').length,
				'`#test1` element should be removed'
			);
		})
		.then(done)
		.catch(done);
	});

	it('cancels the removal of the dom node if it is re-added while transitioning away', (done)=>{
		const leaveDuration = 10;
		addMarkupToDom(
			`<div>
				<span id="test1" data-transition-name="test1" data-transition-enter-duration="0" data-transition-leave-duration="${leaveDuration}"></span>
			</div>`
		)
		.then(_.constant(
			'<div></div>'
		))
		.then(callMorphdom)
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-leave'),
				'`.test1-leave` class should be present'
			);
			assert(
				!$from.find('#test1').is('.test1-leave-active'),
				'`.test1-leave-active` class should not yet be present'
			);
			return Promise.delay(65);
		})
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-leave.test1-leave-active'),
				'`.test1-leave.test1-leave-active` class should now be active'
			);
			return Promise.delay(leaveDuration);
		})

		// Add back the element
		.then(_.constant(
			`<div>
				<span id="test1" data-transition-name="test1" data-transition-enter-duration="0" data-transition-leave-duration="${leaveDuration}"></span>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			assert(
				$from.find('#test1').length === 1,
				'`#test1` element should still be present'
			);
		})
		.then(done)
		.catch(done);
	});

	it('persists the state of animation classes', (done)=>{
		// Test that the class remains present even if missing from re-render
		addMarkupToDom(
			`<div>
				<span id="test1" class="test1-enter" data-transition-name="test1"></span>
				<span id="test2" class="test2-enter test2-enter-active" data-transition-name="test2"></span>
				<span id="test3" class="test3-leave" data-transition-name="test3"></span>
				<span id="test4" class="test4-leave test4-leave-active" data-transition-name="test4"></span>
			</div>`
		)
		.then(_.constant(
			`<div>
				<span id="test1" class="test1-enter" data-transition-name="test1"></span>
				<span id="test2" class="test2-enter test2-enter-active" data-transition-name="test2"></span>
				<span id="test3" class="test3-leave" data-transition-name="test3"></span>
				<span id="test4" class="test4-leave test4-leave-active" data-transition-name="test4"></span>
			</div>`
		))
		.then(callMorphdom)
		.then(()=>{
			assert(
				$from.find('#test1').is('.test1-enter'),
				'`.test1-enter` class should have persisted'
			);
			assert(
				$from.find('#test2').is('.test2-enter.test2-enter-active'),
				'`.test2-enter.test2-enter-active` class should have persisted'
			);
			assert(
				$from.find('#test3').is('.test3-leave'),
				'`.test3-leave` class should have persisted'
			);
			assert(
				$from.find('#test4').is('.test4-leave.test4-leave-active'),
				'`.test4-leave.test4-leave-active` class should have persisted'
			);
		})
		.then(done)
		.catch(done);
	});
});
