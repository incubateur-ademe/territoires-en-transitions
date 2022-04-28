/**
 * Génère un rapport HTML à partir des fichiers JSON générés lors de l'exécution des tests
 */
const os = require('os');
const path = require('path');
const report = require('multiple-cucumber-html-reporter');

const reportName = 'Territoires en Transitions';
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
      { label: 'Version', value: process.env.VERSION.substring(0, 8) },
      { label: 'Rapport généré le', value: new Date().toLocaleString('fr-FR') },
    ],
  },
  metadata: {
    browser: {
      name: 'chrome',
      version: '??',
    },
    platform: {
      name: os.platform(),
      version: os.release(),
    },
  },
});
