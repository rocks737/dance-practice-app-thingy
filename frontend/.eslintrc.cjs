/**
 * ESLint configuration for the frontend workspace.
 * Uses Next.js core recommendations plus Prettier for formatting.
 */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "prettier"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/no-unescaped-entities": "off",
  },
  ignorePatterns: ["node_modules/", ".next/", "out/", "dist/"],
};
