'use strict';
var _ = require( 'lodash' );
var express = require( 'express' );
var path = require( 'path' );

var app = express();

app.use( '/build/', express.static( path.resolve( 'build/' ) ) );

app.get( '/', function ( req, res ) {
	res.sendFile( path.resolve( 'index.html' ) );
} );

var server = app.listen( process.env.port || 3000, function () {
	var port = server.address().port;
	console.log('http://localhost:' + port);
} );
