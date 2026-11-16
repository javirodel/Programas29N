import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".generated/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "pdfs_originales/**",
      "procesados/**",
      "logs/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/lang": "error",
    },
  },
  eslintConfigPrettier,
];

export default eslintConfig;
