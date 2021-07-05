const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: [
    './src/session.js', 
    './src/index.js'
  ],
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Development',
    }),
  ],
  output: {
    filename: '[id].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  target: 'web'
};