import type { Config } from 'jest'

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  // counts every source file, even those no test loads
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text-summary', 'lcov'],
  // the sources import with ".js" (NodeNext); in tests those lead to the .ts
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  testMatch: ['<rootDir>/__tests__/**/*.spec.ts'],
  testEnvironment: 'node',
  // on Node 22 Jest only runs CommonJS, so tests compile to CJS even though
  // the package is ESM; the published build never goes through here
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Bundler',
          verbatimModuleSyntax: false,
        },
      },
    ],
  },
}

export default config
