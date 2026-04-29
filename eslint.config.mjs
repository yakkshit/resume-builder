import next from "eslint-config-next";

export default [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "**/dist/**",
    ],
  },
  {
    rules: {
      // Next 16 + current codebase triggers many false-positives with these experimental rules.
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react/display-name": "off",
      "react-hooks/static-components": "off",
    },
  },
];

