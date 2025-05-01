/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    testMatch: [
        '**/test/**/*.test.js',
        '**/test/**/*.spec.js'
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__mocks__/',
        '/test/'
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleFileExtensions: ['js', 'json'],
    testTimeout: 10000,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    moduleNameMapper: {
        '^homey-zwavedriver$': '<rootDir>/__mocks__/homey-zwavedriver.js',
        '^homey$': '<rootDir>/__mocks__/homey.js'
    },
    transform: {
        '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
    },
    verbose: true,
    testPathIgnorePatterns: [
        '/node_modules/',
        '/.homeybuild/'
    ]
};

module.exports = config;
