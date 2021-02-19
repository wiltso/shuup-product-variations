module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'no-console': 'off',
    'max-len': ['error', { code: 120, tabWidth: 2 }],
    'linebreak-style': 0,
  },
  globals: {
    gettext: false,
    ngettext: false,
    interpolate: false,
  },
};
