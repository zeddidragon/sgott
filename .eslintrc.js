module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    node: true,
  },
  rules: {
    'prefer-const': 'error',
    'indent': ['error', 2],
    // 'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'always-multiline'],
  },
}
