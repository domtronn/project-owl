const path = require('path')

const BuildNotifierPlugin = require('webpack-build-notifier')

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',

  entry: {
    content: './src/app/content.jsx',
    background: './src/app/background.js',
    popup: './src/ui/popup.jsx',
  },

  output: {
    path: path.resolve(__dirname, 'dist/js'),
    filename: '[name].js'
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },

  plugins: [
    new BuildNotifierPlugin({
      title: 'Commentable built'
    })
  ],

  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.jsx?$/, loader: 'babel-loader', options: { presets: ['@babel/preset-react'] } },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
};
