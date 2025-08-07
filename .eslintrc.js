export default {
    env: {
        node: true,
        es2021: true,
        es6: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    rules: {
        // Regras de estilo
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        
        // Regras de qualidade
        'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
        'no-console': 'off', // Permitir console.log em desenvolvimento
        'no-debugger': 'warn',
        
        // Regras de complexidade
        'complexity': ['warn', 10],
        'max-depth': ['warn', 4],
        'max-lines': ['warn', 300],
        'max-params': ['warn', 5],
        
        // Regras de segurança
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        
        // Regras de boas práticas
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'prefer-template': 'error',
        
        // Regras específicas para Node.js
        'no-process-exit': 'error',
        'no-path-concat': 'error'
    },
    overrides: [
        {
            files: ['src/routes/*.js'],
            rules: {
                'max-lines': ['warn', 500] // Rotas podem ser mais longas
            }
        },
        {
            files: ['src/models/*.js'],
            rules: {
                'max-lines': ['warn', 400] // Modelos podem ser mais longos
            }
        }
    ]
}; 