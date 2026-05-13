import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "node_modules/**", "data/**"] },
  ...nextVitals,
];

export default config;
