module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: '18'
            }
        }]
    ],
    env: {
        test: {
            plugins: [
                '@babel/plugin-transform-modules-commonjs'
            ]
        }
    }
};
