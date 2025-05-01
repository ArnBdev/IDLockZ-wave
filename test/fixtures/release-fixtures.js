'use strict';

const BASE_VERSION = '1.0.0';

const TEST_FILES = {
    'package.json': {
        version: BASE_VERSION,
        name: 'com.idlock',
        main: 'app.js',
        engines: {
            node: '>=18.0.0'
        }
    },
    'app.json': {
        version: BASE_VERSION,
        name: 'ID Lock',
        description: 'Control your ID Lock'
    },
    '.homeychangelog.json': {
        [BASE_VERSION]: {
            en: 'Initial release',
            no: 'Første versjon'
        }
    }
};

const TEST_COMMITS = [
    'feat: add auto-lock feature',
    'fix: battery reporting',
    'docs: update readme',
    'test: add flow card tests',
    'chore: update dependencies'
];

const TEST_BRANCHES = [
    'main',
    'develop',
    'feature/auto-lock',
    'fix/battery'
];

const MOCK_GIT_LOG = TEST_COMMITS.join('\n');

const VERSION_INCREMENTS = {
    major: {
        from: '1.0.0',
        to: '2.0.0',
        commits: [
            'BREAKING CHANGE: new Z-Wave implementation',
            'feat: complete rewrite of core functionality'
        ]
    },
    minor: {
        from: '1.0.0',
        to: '1.1.0',
        commits: [
            'feat: add user management',
            'feat: implement away mode'
        ]
    },
    patch: {
        from: '1.0.0',
        to: '1.0.1',
        commits: [
            'fix: battery percentage calculation',
            'fix: status updates'
        ]
    }
};

const ERROR_SCENARIOS = {
    missingFiles: [
        'package.json',
        'app.json',
        '.homeychangelog.json'
    ],
    invalidContent: {
        'package.json': '{invalid json}',
        'app.json': 'not json at all'
    },
    versionMismatch: {
        'package.json': { version: '1.0.0' },
        'app.json': { version: '1.0.1' }
    },
    missingChangelog: {
        '1.0.0': undefined,
        '1.0.1': {}
    }
};

const TEST_ENVIRONMENTS = {
    development: {
        NODE_ENV: 'development',
        DEBUG: 'true'
    },
    test: {
        NODE_ENV: 'test',
        DEBUG: 'false'
    },
    production: {
        NODE_ENV: 'production',
        DEBUG: 'false'
    }
};

const MOCK_RESPONSES = {
    gitStatus: {
        clean: '',
        dirty: ' M package.json\n?? newfile.js'
    },
    gitTags: {
        empty: '',
        single: 'v1.0.0',
        multiple: 'v1.0.0\nv1.0.1\nv1.1.0'
    },
    gitBranches: {
        main: '* main',
        feature: '  main\n* feature/test'
    }
};

function createTestRepo(files = TEST_FILES, commits = TEST_COMMITS) {
    return {
        files,
        commits,
        currentBranch: 'main',
        tags: ['v1.0.0'],
        branches: ['main']
    };
}

function mockGitCommands(repo) {
    return {
        'git init': { stdout: '', stderr: '' },
        'git add .': { stdout: '', stderr: '' },
        'git commit': { stdout: 'Created commit', stderr: '' },
        'git tag': { stdout: repo.tags.join('\n'), stderr: '' },
        'git branch': { stdout: repo.branches.join('\n'), stderr: '' },
        'git status': { stdout: '', stderr: '' }
    };
}

function createChangelog(version, changes = []) {
    return {
        [version]: {
            en: changes.map(c => `- ${c}`).join('\n'),
            no: changes.map(c => `- ${c}`).join('\n')
        }
    };
}

module.exports = {
    BASE_VERSION,
    TEST_FILES,
    TEST_COMMITS,
    TEST_BRANCHES,
    MOCK_GIT_LOG,
    VERSION_INCREMENTS,
    ERROR_SCENARIOS,
    TEST_ENVIRONMENTS,
    MOCK_RESPONSES,
    createTestRepo,
    mockGitCommands,
    createChangelog
};
