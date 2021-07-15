const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: [
    './src/worker.js', 
    './src/auth.js'
  ],
  plugins: [
    new HtmlWebpackPlugin({
      title: 'SSO server',
    }),
  ],
  output: {
    filename: '[id].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: true,
            }
          }
        ]
      },
      // {
      //   test: /\.worker\.js$/,
      //   use: { loader: "worker-loader" },
      // },
    ] 
  }
};