module.exports = {
	root: true,
	env: {
		node: true,
	},
	extends: ['plugin:vue/vue3-recommended', 'eslint:recommended'],
	plugins: [],
	rules: {
		'vue/require-prop-types': 0,
		'vue/html-indent': ['error', 'tab'],
		'vue/multi-word-component-names': 0,
		indent: ['error', 'tab'],
		'linebreak-style': ['error', 'windows'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		'space-before-function-paren': ['error', 'always'],
		'comma-dangle': ['error', 'always-multiline'],
		'no-trailing-spaces': ['error'],
		'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
	},
	overrides: [
		{
			files: ['*.html'],
			rules: {
				'vue/comment-directive': 'off',
			},
		},
	],
};
