/**
 * Génère un rapport HTML à partir des fichiers JSON générés lors de l'exécution des tests
 */
const os = require('os');
const path = require('path');
const report = require('multiple-cucumber-html-reporter');

const reportName = 'Territoires en Transitions';
const VERSION =
  process.env.GIT_HEAD_REF + '.' + process.env.GIT_SHA?.substring(0, 8);
const reportPath = path.join(__dirname, '..', './report');

report.generate({
  jsonDir: path.join(__dirname, '..', './cypress/cucumber-json/'),
  reportPath,
  reportName,
  pageTitle: reportName,
  displayDuration: true,
  displayReportTime: true,
  pageFooter: '',
  customData: {
    title: 'Run info',
    data: [
      { label: 'Version', value: VERSION },
      { label: 'Rapport généré le', value: new Date().toLocaleString('fr-FR') },
    ],
  },
  metadata: {
    browser: {
      name: process.env.BROWSER || '??',
      version: process.env.BROWSER_VERSION || '??',
    },
    platform: {
      name: os.platform(),
      version: os.release(),
    },
  },
});
