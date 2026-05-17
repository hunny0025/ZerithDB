/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["zerithdb-eslint-config"],
  env: {
    browser: true,
    es2022: true,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
};
