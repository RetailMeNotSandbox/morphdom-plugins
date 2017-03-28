'use strict';
var _ = require( 'lodash' );
var express = require( 'express' );
var path = require( 'path' );

var app = express();

app.use( '/build/', express.static( path.resolve( 'build/' ) ) );

app.get( '/', function ( req, res ) {
	res.send( [
		'<html>',
		'  <head>',
		'    <title>@retailmenot/morphdom-plugins Demo</title>',
		'    <script type="text/javascript" src="/build/example.js"></script>',
		'    <link rel="stylesheet" type="text/css" href="/build/example.css"></link>',
		'  </head>',
		'  <body>',
		'    <div class="js-demo"></div>',
		'  </body>',
		'</html>'
	].join( '\n' ) );
} );

var server = app.listen( process.env.port || 3000, function () {
	var port = server.address().port;
	console.log('http://localhost:' + port);
} );
