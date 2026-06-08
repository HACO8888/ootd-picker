import next from "eslint-config-next";

/** Next.js 16 ships a native flat config array. */
const eslintConfig = [
  ...next,
  {
    ignores: ["legacy/**", ".next/**", "node_modules/**", "public/**", "e2e/**", "playwright-report/**", "test-results/**"],
  },
  {
    // The Material Symbols icon font is loaded via a <link> with display=block
    // on purpose (block avoids a flash of the icon's ligature text). These two
    // rules are pages-router oriented and misfire for an app-router icon font.
    files: ["src/app/layout.tsx"],
    rules: {
      "@next/next/no-page-custom-font": "off",
      "@next/next/google-font-display": "off",
    },
  },
];

export default eslintConfig;
