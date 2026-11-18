// Configuration des tests (équivalente à celle d'Angular par défaut), avec un lanceur Chrome muni d'un FAUX micro :
// il permet de tester les enregistrements audio avec le vrai MediaRecorder du navigateur, sans micro ni fenêtre.
module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular-devkit/build-angular'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-coverage'),
            require('@angular-devkit/build-angular/plugins/karma')
        ],
        client: { jasmine: {}, clearContext: false },
        jasmineHtmlReporter: { suppressAll: true },
        coverageReporter: {
            dir: require('path').join(__dirname, './coverage/sakai-ng'),
            subdir: '.',
            reporters: [{ type: 'html' }, { type: 'text-summary' }]
        },
        reporters: ['progress', 'kjhtml'],
        browsers: ['Chrome'],
        customLaunchers: {
            ChromeHeadlessMedia: {
                base: 'ChromeHeadless',
                flags: [
                    '--use-fake-ui-for-media-stream',
                    '--use-fake-device-for-media-stream',
                    '--autoplay-policy=no-user-gesture-required'
                ]
            }
        },
        restartOnFileChange: true
    });
};
