module.exports = {
	'env': {
		'browser': true,
		'commonjs': true,
		'es2021': true,
		'node': true,
	},
	'extends': 'eslint:recommended',
	'overrides': [
	],
	'parserOptions': {
		'ecmaVersion': 'latest',
		'sourceType': 'module',
	},
	'rules': {
		'indent': [
			'error',
			'tab',
		],
		'linebreak-style': [
			'error',
			'unix',
		],
		'quotes': [
			'error',
			'single',
		],
		'semi': [
			'error',
			'always',
		],
		'space-before-function-paren': [
			'error',
			'always',
		],
		'comma-dangle': [
			'error',
			'always-multiline',
		],
		'no-trailing-spaces': [
			'error',
		],
		'no-multiple-empty-lines': [
			'error',
			{
				'max': 1,
				'maxEOF': 0,
			},
		],
		'no-empty': [
			'error',
			{
				'allowEmptyCatch': true,
			},
		],
	},
};
