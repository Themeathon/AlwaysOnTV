import globals from 'globals';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        extends: ["js/recommended"],
        plugins: {
            js
        },
        languageOptions: {
            // see https://node.green/ for supported ES versions
            ecmaVersion: 14,
            sourceType: "module",
            globals: globals.nodeBuiltin,
        },
        // Place for our own rules on top of js/recommended
        rules: {}
    }
]);
