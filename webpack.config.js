const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

module.exports = (env, argv) => {
  return {
    mode: argv.mode,
    entry: './src/index.js',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, '.')
    },
    watch: argv.mode === "development",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react']
            }
          }
        }
      ]
    },
    optimization: {
      minimizer: [new UglifyJsPlugin()]
    }
  };
};
