import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
    ...pluginVue.configs['flat/recommended'],
    {
        // vue-specific rules at https://eslint.vuejs.org/rules/
        rules: {},
        languageOptions: {
            ecmaVersion: 14,
            sourceType: 'module',
            globals: {
                ...globals.browser
            }
        }
    }
]
