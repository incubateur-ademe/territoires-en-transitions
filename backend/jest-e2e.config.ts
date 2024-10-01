/* eslint-disable */
export default {
  displayName: 'backend-e2e',
  preset: '../jest.preset.js',
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['**/*/*.e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec-e2e.json' },
    ],
  },
  coverageDirectory: '../coverage/backend-e2e',
};
