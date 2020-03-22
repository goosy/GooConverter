import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
	input: 'src/index.js',
	output: [{
		file: pkg.exports.default,
		format: 'es',
	}, {
		file: pkg.exports.require,
		format: 'cjs',
	}],
	plugins: [
		resolve({
			preferBuiltins: true,
		}), // tells Rollup how to find XX in node_modules
		commonjs(),
		json()
	],
	external: ['fs', 'path', 'net'],
}
