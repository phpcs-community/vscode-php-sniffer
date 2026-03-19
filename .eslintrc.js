module.exports = {
  root: true,
  extends: ['airbnb-base', 'prettier'],
  rules: {
    'no-underscore-dangle': 0,
    'import/no-unresolved': [
      'error',
      { commonjs: true, caseSensitive: true, ignore: ['vscode'] },
    ],
  },
};
