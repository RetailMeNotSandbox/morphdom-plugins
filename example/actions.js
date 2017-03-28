'use strict';
var reduxActions = require( 'redux-actions/dist/redux-actions' );
var actions = module.exports = {
	MOVE_ELEMENT: reduxActions.createAction( 'MOVE_ELEMENT' ),
	TOGGLE_ADVANCED_DEMO: reduxActions.createAction( 'TOGGLE_ADVANCED_DEMO' ),
	TOGGLE_COLLAPSED: reduxActions.createAction( 'TOGGLE_COLLAPSED' ),
	TOGGLE_NEW_ELEMENT: reduxActions.createAction( 'TOGGLE_NEW_ELEMENT' ),
	TOGGLE_PLUGINS: reduxActions.createAction( 'TOGGLE_PLUGINS' ),
	TOGGLE_SLIDE_ELEMENT: reduxActions.createAction( 'TOGGLE_SLIDE_ELEMENT' ),
	TRIGGER_RERENDER: reduxActions.createAction( 'TRIGGER_RERENDER' ),
};
