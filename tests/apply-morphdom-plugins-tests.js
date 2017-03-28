'use strict';
const _ = require('lodash');
const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
const $ = require('jquery');

const applyMorphdomPlugins = require('..').applyMorphdomPlugins;

describe('applyMorphdomPlugins', function () {
	it('throws if getNodeKey is specified by a plugin', ()=>{
		var pluginsConfig = [{
			getNodeKey: function () {}
		}];
		assert.throws(
			applyMorphdomPlugins.bind(null, pluginsConfig),
			'You can not create a plugin that wraps getNodeKey.',
			'should throw if getNodeKey is specified'
		);
	});

	it('throws if childrenOnly is specified by a plugin', ()=>{
		var pluginsConfig = [{
			childrenOnly: function () {}
		}];
		assert.throws(
			applyMorphdomPlugins.bind(null, pluginsConfig),
			'You can not create a plugin that wraps childrenOnly.',
			'should throw if childrenOnly is specified'
		);
	});

	it('notifies all of the nothing returning methods in the plugin ' +
			'chain, regardless of their return value', ()=>{
		var pluginAConfig = {
			onNodeDiscarded: function () {
				return false;
			},
			onNodeAdded: function () {
			},
			onElUpdated: function () {
				return true;
			}
		};
		var pluginBConfig = {
			onNodeDiscarded: function () {
				return false;
			},
			onNodeAdded: function () {
				return true;
			},
			onElUpdated: function () {
				return true;
			}
		};
		_.each(pluginAConfig, (method, name)=>{
			sinon.spy(pluginAConfig, name);
			sinon.spy(pluginBConfig, name);
		});
		var pluginsConfig = [pluginAConfig, pluginBConfig];
		var composedConfig = applyMorphdomPlugins(pluginsConfig);

		// Test that the methods who return nothing are all invoked for both
		// plugins when invoking them on the composed config, regardless of what
		// they returned
		composedConfig.onNodeDiscarded();
		composedConfig.onNodeAdded();
		composedConfig.onElUpdated();
		assert(
			pluginAConfig.onNodeDiscarded.calledOnce === true,
			'expected pluginAConfig.onNodeDiscarded to have been called once'
		);
		assert(
			pluginBConfig.onNodeDiscarded.calledOnce === true,
			'expected pluginBConfig.onNodeDiscarded to have been called once'
		);
		assert(
			pluginAConfig.onNodeAdded.calledOnce === true,
			'expected pluginAConfig.onNodeAdded to have been called once'
		);
		assert(
			pluginBConfig.onNodeAdded.calledOnce === true,
			'expected pluginBConfig.onNodeAdded to have been called once'
		);
		assert(
			pluginAConfig.onElUpdated.calledOnce === true,
			'expected pluginAConfig.onElUpdated to have been called once'
		);
		assert(
			pluginBConfig.onElUpdated.calledOnce === true,
			'expected pluginBConfig.onElUpdated to have been called once'
		);
	});

	it('handles the boolean returning methods appropriately', ()=>{
		var pluginAConfig = {
			onBeforeElChildrenUpdated: function () {
				return false;
			},
			onBeforeNodeDiscarded: function () {
				return true;
			}
		};
		var pluginBConfig = {
			onBeforeElChildrenUpdated: function () {
				return true;
			},
			onBeforeNodeDiscarded: function () {
				return false;
			}
		};
		_.each(pluginAConfig, (method, name)=>{
			sinon.spy(pluginAConfig, name);
			sinon.spy(pluginBConfig, name);
		});
		var pluginsConfig = [pluginAConfig, pluginBConfig];
		var composedConfig = applyMorphdomPlugins(pluginsConfig);

		// Test that the methods who return nothing are all invoked for both
		// plugins when invoking them on the composed config, regardless of what
		// they returned
		assert.equal(
			composedConfig.onBeforeElChildrenUpdated(),
			false,
			'the composed onBeforeElChildrenUpdated should return false ' +
			'because of pluginA'
		);
		assert.equal(
			composedConfig.onBeforeNodeDiscarded(),
			false,
			'the composed onBeforeNodeDiscarded should return false because ' +
			'of pluginB'
		);
		assert(
			pluginAConfig.onBeforeElChildrenUpdated.callCount === 1,
			'expected pluginAConfig.onBeforeElChildrenUpdated to have been ' +
			'called once'
		);
		assert(
			pluginBConfig.onBeforeElChildrenUpdated.callCount === 0,
			'expected pluginBConfig.onBeforeElChildrenUpdated to not have ' +
			'been called because its implementation for plugin A returned false'
		);
		assert(
			pluginAConfig.onBeforeNodeDiscarded.callCount === 1,
			'expected pluginAConfig.onBeforeNodeDiscarded to have been ' +
			'called once'
		);
		assert(
			pluginBConfig.onBeforeNodeDiscarded.callCount === 1,
			'expected pluginBConfig.onBeforeNodeDiscarded to have been ' +
			'called once'
		);
	});

	it('handles onBeforeNodeAdded properly', ()=>{
		var pluginAConfig = {
			onBeforeNodeAdded: function (newEl) {
				newEl.pluginA = true;
				return newEl;
			}
		};
		var pluginBConfig = {
			onBeforeNodeAdded: function (newEl) {
				newEl.pluginB = true;
				return newEl;
			}
		};
		_.each(pluginAConfig, (method, name)=>{
			sinon.spy(pluginAConfig, name);
			sinon.spy(pluginBConfig, name);
		});
		var pluginsConfig = [pluginAConfig, pluginBConfig];
		var composedConfig = applyMorphdomPlugins(pluginsConfig);

		// Test that the methods who return nothing are all invoked for both
		// plugins when invoking them on the composed config, regardless of what
		// they returned
		var $elt = $('<div>');
		var newEl = composedConfig.onBeforeNodeAdded($elt.get(0));
		assert(
			pluginAConfig.onBeforeNodeAdded.calledOnce === true,
			'expected pluginAConfig.onBeforeNodeAdded to have been called once'
		);
		assert(
			pluginBConfig.onBeforeNodeAdded.calledOnce === true,
			'expected pluginBConfig.onBeforeNodeAdded to have been called once'
		);
		assert(
			newEl.pluginA === true,
			'element does not reflect the change made by pluginA'
		);
		assert(
			newEl.pluginB === true,
			'element does not reflect the change made by pluginB'
		);
	});

	it('handles onBeforeElUpdated properly', ()=>{
		var pluginAConfig = {
			onBeforeElUpdated: function (fromEl, toEl) {
				toEl.pluginA = true;
				return true;
			}
		};
		var pluginBConfig = {
			onBeforeElUpdated: function (fromEl, toEl) {
				toEl.pluginB = true;
				return toEl;
			}
		};
		_.each(pluginAConfig, (method, name)=>{
			sinon.spy(pluginAConfig, name);
			sinon.spy(pluginBConfig, name);
		});
		var $fromEl = $('<div>');
		var $toEl = $('<div>');
		var pluginsConfig = [pluginAConfig, pluginBConfig];
		var composedConfig = applyMorphdomPlugins(pluginsConfig);
		var newEl = composedConfig.onBeforeElUpdated($fromEl.get(0), $toEl.get(0));
		assert(
			pluginAConfig.onBeforeElUpdated.calledOnce === true,
			'expected pluginAConfig.onBeforeElUpdated to have been called once'
		);
		assert(
			pluginBConfig.onBeforeElUpdated.calledOnce === true,
			'expected pluginBConfig.onBeforeElUpdated to have been called once'
		);
		assert(
			newEl.pluginA === true,
			'element does not reflect the change made by pluginA'
		);
		assert(
			newEl.pluginB === true,
			'element does not reflect the change made by pluginB'
		);
	});

	it('throws if onBeforeElUpdated or onBeforeNodeAdded returns undefined', ()=>{
		var pluginAConfig = {
			onBeforeElUpdated: function (fromEl, toEl) {
				toEl.pluginA = true;
			},
			onBeforeNodeAdded: function (elt) {
				elt.pluginA = true;
			}
		};
		var pluginBConfig = {
			onBeforeElUpdated: function (fromEl, toEl) {
				toEl.pluginB = true;
			},
			onBeforeNodeAdded: function (elt) {
				elt.pluginB = true;
			}
		};
		_.each(pluginAConfig, (method, name)=>{
			sinon.spy(pluginAConfig, name);
			sinon.spy(pluginBConfig, name);
		});
		var $fromEl = $('<div>');
		var $toEl = $('<div>');
		var pluginsConfig = [pluginAConfig, pluginBConfig];
		var composedConfig = applyMorphdomPlugins(pluginsConfig);
		assert.throws(
			composedConfig.onBeforeElUpdated.bind(null, $fromEl.get(0), $toEl.get(0)),
			'You must return a boolean, or the element to be updated ' +
			'from onBeforeElUpdated'
		);
		assert.throws(
			composedConfig.onBeforeNodeAdded.bind(null, $fromEl.get(0)),
			'You must return a boolean, or the element to be updated ' +
			'from onBeforeNodeAdded'
		);
	});

	it('allows you to specify a base config and runs those methods before ' +
			'the plugins', ()=>{
		var baseMorphdomConfig = {
			getNodeKey: function (elt) {
				return 'TEST_' + elt.id;
			},
			childrenOnly: true,
			onBeforeNodeAdded: function (elt) {
				return false;
			}

		};
		var pluginAConfig = {
			onBeforeNodeAdded: function (elt) {
				elt.pluginA = true;
				return elt;
			}
		};
		_.each(pluginAConfig, (method, name)=>{
			sinon.spy(pluginAConfig, name);
			sinon.spy(baseMorphdomConfig, name);
		});
		var $elt = $('<div id="ID">');
		var elt = $elt.get(0);
		var pluginsConfig = [pluginAConfig];
		var composedConfig = applyMorphdomPlugins(pluginsConfig, baseMorphdomConfig);
		assert(
			composedConfig.childrenOnly === true,
			'childrenOnly should have been preserved from base config'
		);
		assert(
			composedConfig.getNodeKey(elt) === 'TEST_ID',
			'getNodeKey should have been preserved from base config'
		);
		var newElt = composedConfig.onBeforeNodeAdded(elt);
		assert(
			baseMorphdomConfig.onBeforeNodeAdded.calledOnce === true,
			'expected baseMorphdomConfig.onBeforeNodeAdded to have been ' +
			'called once'
		);
		assert(
			pluginAConfig.onBeforeNodeAdded.callCount === 0,
			'expected pluginAConfig.onBeforeNodeAdded to not have been ' +
			'called because the base config returns false'
		);
		assert(
			newElt.pluginA === undefined,
			'element reflects the change made by pluginA when it should not ' +
			'have been allowed to execute'
		);
	});

	it('allows you to specify a base config and executes the plugin code ' +
			'when appropriate', ()=>{
		var baseMorphdomConfig = {
			onBeforeElUpdated: function (fromEl, toEl) {
				toEl.baseConfig = true;
				return toEl;
			}

		};
		var pluginAConfig = {
			onBeforeElUpdated: function (fromEl, toEl) {
				toEl.pluginA = true;
				return toEl;
			}
		};
		_.each(pluginAConfig, (method, name)=>{
			sinon.spy(pluginAConfig, name);
			sinon.spy(baseMorphdomConfig, name);
		});
		var $fromEl = $('<div>');
		var $toEl = $('<div>');
		var pluginsConfig = [pluginAConfig];
		var composedConfig = applyMorphdomPlugins(pluginsConfig, baseMorphdomConfig);
		var newElt = composedConfig.onBeforeElUpdated($fromEl.get(0), $toEl.get(0));
		assert(
			baseMorphdomConfig.onBeforeElUpdated.calledOnce === true,
			'expected baseMorphdomConfig.onBeforeElUpdated to have been ' +
			'called once'
		);
		assert(
			pluginAConfig.onBeforeElUpdated.calledOnce === true,
			'expected pluginAConfig.onBeforeElUpdated to have been called once'
		);
		assert(
			newElt.baseConfig === true,
			'element should reflect the change from the base config'
		);
		assert(
			newElt.pluginA === true,
			'element should reflect the change made by pluginA'
		);
	});
});
