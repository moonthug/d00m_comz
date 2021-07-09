module.exports = {
  roots: ['<rootDir>/src'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  setupFiles: ['<rootDir>/.jest/env.js'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
