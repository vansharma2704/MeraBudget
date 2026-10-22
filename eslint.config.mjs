// eslint-config-next 16 ships native flat configs (the old FlatCompat bridge crashes with it)
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    rules: {
      // Client hydration and browser API subscriptions legitimately initialize
      // local state in effects throughout this application.
      "react-hooks/set-state-in-effect": "off",
    },
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
