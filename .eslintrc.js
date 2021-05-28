module.exports = {
  extends: ['react-app', 'plugin:prettier/recommended'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-redeclare': 'off',
  },
};
