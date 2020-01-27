import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
	input: 'src/index.js',
	output: [{
		file: pkg['main'],
		format: 'es',
	}, {
		file: pkg['exports']["./cjs"],
		format: 'cjs',
	}],
	plugins: [
		resolve({
			preferBuiltins: true,
		}), // tells Rollup how to find XX in node_modules
		commonjs(), // converts XX to ES modules
		json()
	],
	external: ['fs', 'path', 'net'],
}
