module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  collectCoverageFrom: [
    "app.js",
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "routes/**/*.js",
    "utils/**/*.js",
  ],
  coverageDirectory: "coverage",
};
