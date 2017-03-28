'use strict';
var reduxActions = require( 'redux-actions/dist/redux-actions' );
var immutable = require( 'object-path-immutable' );
module.exports = reduxActions.handleActions( {
	TOGGLE_NEW_ELEMENT: function ( state ) {
		return immutable( state )
		.set( 'includeNewElement', !state.includeNewElement )
		.value();
	},
	TOGGLE_ADVANCED_DEMO: function ( state ) {
		return immutable( state )
		.set( 'includeAdvancedDemoElements', !state.includeAdvancedDemoElements )
		.value();
	},
	TOGGLE_SLIDE_ELEMENT: function ( state ) {
		return immutable( state )
		.set( 'includeSlideElement', !state.includeSlideElement )
		.value();
	},
	TOGGLE_PLUGINS: function ( state ) {
		return immutable( state )
		.set( 'pluginsAreEnabled', !state.pluginsAreEnabled )
		.value();
	},
	TOGGLE_COLLAPSED: function ( state ) {
		return immutable( state )
		.set( 'isCollapsed', !state.isCollapsed )
		.value();
	},
	TRIGGER_RERENDER: function ( state ) {
		return immutable( state )
		.set( 'renderCount', state.renderCount + 1 )
		.value();
	},
	MOVE_ELEMENT: function ( state ) {
		return immutable( state )
		.set( 'isMoved', !state.isMoved )
		.value();
	}
}, {} );
