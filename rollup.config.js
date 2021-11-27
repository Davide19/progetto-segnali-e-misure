import resolve from 'rollup-plugin-node-resolve';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    //sourceMap: '-m inline'
  },
  name: 'MyModule',
  plugins: [
    resolve(),
    copy({
      targets: [
        { src: 'index.html', dest: 'dist' },
        { src: 'node_modules/bulma/css/bulma.css', dest: 'dist/bulma'}
      ]
    })
  ]
};