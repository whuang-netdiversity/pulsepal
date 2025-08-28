// eslint.config.cjs
const jsdoc = require('eslint-plugin-jsdoc');

module.exports = [
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 12,
            sourceType: 'module',
            globals: {
                browser: true
            }
        },
        plugins: {
            jsdoc
        },
        rules: {
            'max-len': ['warn', { code: 120 }],
            'brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
            'curly': ['error', 'multi-line', 'consistent'],
            'semi': ['error', 'always'],
            'no-unused-vars': 'warn',
            'indent': ['error', 4, { SwitchCase: 1 }],

            // JSDoc rules
            'jsdoc/require-jsdoc': ['warn', {
                require: {
                    FunctionDeclaration: true,
                    MethodDefinition: false,
                    ClassDeclaration: false,
                    ArrowFunctionExpression: false,
                    FunctionExpression: true
                }
            }],
            'jsdoc/require-param': 'warn',
            'jsdoc/require-returns': 'warn',
            'jsdoc/check-param-names': 'error',
            'jsdoc/check-tag-names': 'error',
            'jsdoc/check-types': 'warn'
        },
        settings: {
            jsdoc: {
                mode: 'typescript'
            }
        }
    }
];
