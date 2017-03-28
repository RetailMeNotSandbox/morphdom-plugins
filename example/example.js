'use strict';
require( './index.scss' );
var $ = require( 'jquery' );
var actions = require( './actions' );
var showBundleTmpl = require( './index.hbs' );
var demoReducer = require( './reducer' );
var morphdom = require( 'morphdom' );
var redux = require( 'redux' );
var morphdomPlugins = require( '@retailmenot/morphdom-plugins' );

const toggleNewElementSelector = '.js-toggle-new-element';
const rerenderSelector = '.js-rerender';
const togglePluginsSelector = '.js-toggle-plugins';
const colorMeSelector = '.js-color-me';
const toggleSlideElementSelector = '.js-toggle-expand-element';
const toggleSlideToggableElementSelector = '.js-toggle-slide-toggle-element';
const doTheSlideToggleSelector = '.js-toggle-toggle-slide-toggle-element';
const toggleAdvancedDemoSelector = '.js-toggle-advanced-elements';
const handleOnMoveSelector = '.js-move-element';

var $node;
$(function setupApp(){
	$node = $('.js-demo');
	$(document).on('click', toggleNewElementSelector, toggleNewElement);
	$(document).on('click', toggleSlideElementSelector, toggleSlideElement);
	$(document).on('click', rerenderSelector, triggerRerender);
	$(document).on('click', togglePluginsSelector, togglePlugins);
	$(document).on('click', colorMeSelector, handleColorChange);
	$(document).on('click', doTheSlideToggleSelector, doTheSlideToggle);
	$(document).on('click', handleOnMoveSelector, handleOnMove);
	$(document).on('click', toggleAdvancedDemoSelector, toggleAdvancedDemo);
	render();
});

const initialState = {
	renderCount: 0,
	includeNewElement: false,
	pluginsAreEnabled: true,
	includeAdvancedDemoElements: false,
	isCollapsed: true
};

var compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || redux.compose;

const store = redux.createStore(
	demoReducer,
	initialState,
	compose(
		redux.applyMiddleware.apply( null, [] )
	)
);

const morphdomConfig = morphdomPlugins.applyMorphdomPlugins( [
	morphdomPlugins.inputPersistence.plugin(),
	morphdomPlugins.cssTransitionGroup.plugin(),
	morphdomPlugins.transitionElementMovement.plugin(),
	morphdomPlugins.attrPersistence.plugin(),
	morphdomPlugins.transitionHeight.plugin()
]);

function render() {
	var model = store.getState();
	var html = showBundleTmpl( model );
	morphdom( $node.get(0), html, morphdomConfig );
}

store.subscribe( render );

function handleColorChange( ev ) {
	$( ev.target )
	.parents( '.sample' )
	.toggleClass( 'is-green' );
};

function toggleNewElement() {
	store.dispatch( actions.TOGGLE_NEW_ELEMENT() );
};

function toggleSlideElement() {
	store.dispatch( actions.TOGGLE_SLIDE_ELEMENT() );
};

function toggleAdvancedDemo() {
	store.dispatch( actions.TOGGLE_ADVANCED_DEMO() );
};

function triggerRerender() {
	store.dispatch( actions.TRIGGER_RERENDER() );
};

function doTheSlideToggle() {
	store.dispatch( actions.TOGGLE_COLLAPSED() );
};

function togglePlugins() {
	store.dispatch( actions.TOGGLE_PLUGINS() );
};

function handleOnMove() {
	store.dispatch( actions.MOVE_ELEMENT() );
};
