/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  rules: {
    // Document types intentionally use `any` in generic constraints (e.g. Record<string, any>)
    "@typescript-eslint/no-explicit-any": "off",
  },
};
