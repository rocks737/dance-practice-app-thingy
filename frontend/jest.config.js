const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const commonConfig = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**",
  ],
};

const unitProjectFactory = createJestConfig({
  ...commonConfig,
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(spec|test).[jt]s?(x)",
    "<rootDir>/src/**/*.(spec|test).[jt]s?(x)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "[-.]integration\\.test\\.[jt]sx?$"],
});

const integrationProjectFactory = createJestConfig({
  ...commonConfig,
  testMatch: ["<rootDir>/src/**/*.integration.test.[jt]s?(x)"],
  testTimeout: 60000,
});

module.exports = async () => {
  const [unitConfig, integrationConfig] = await Promise.all([
    unitProjectFactory(),
    integrationProjectFactory(),
  ]);
  unitConfig.displayName = "unit";
  integrationConfig.displayName = "integration";
  return {
    projects: [unitConfig, integrationConfig],
  };
};
