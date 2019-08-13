import pkg from './package.json';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

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
		json(),
		production && terser() // minify, but only in production
	],
	external: ['fs', 'path', 'net'],
}
