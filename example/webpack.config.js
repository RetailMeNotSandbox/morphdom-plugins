const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	devtool: '#inline-source-map',
	resolve: {
		alias: {
			jquery: require.resolve('jquery')
		}
	},
	node: {
		Buffer: false,
		Crypto: false
	},
	entry: {
		example: path.resolve('example.js')
	},
	output: {
		filename: '[name].js',
		path: path.resolve('build')
	},
	module: {
		loaders: [{
			test: /\.scss$/,
			loader: ExtractTextPlugin.extract({
				fallback: 'style-loader',
				use: 'css-loader!sass-loader'
			})
		}, {
			test: /\.hbs|\.handlebars$/,
			loader: require.resolve('handlebars-loader')
		}]
	},
	plugins: [

		// Pull imported sass out of the main chunk
		new ExtractTextPlugin(
			{
				filename: '[name].css',
				allChunks: true
			}
		)
	]
};
