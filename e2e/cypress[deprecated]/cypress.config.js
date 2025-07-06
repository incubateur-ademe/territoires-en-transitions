const { defineConfig } = require('cypress');
const setupNodeEvents = require('./cypress/plugins');

/** Configuration Cypress */
module.exports = defineConfig({
  e2e: {
    // url de l'app
    baseUrl: 'http://localhost:3000',
    // désactive la génération de vidéos en mode "headless"
    video: false,
    // taille de la fenêtre dans laquelle l'app est chargée
    viewportWidth: 1280,
    viewportHeight: 1024,
    requestTimeout: 10000,
    // lorsqu'un test échoue...
    retries: {
      // ...on refait 2 tentatives en mode "headless"
      runMode: 2,
      // ...mais aucune en mode interactif (dev)
      openMode: 0,
    },
    // scénarios de test à traiter
    specPattern: '**/*.feature',
    // configuration des plugins
    setupNodeEvents,
    // et des commandes personnalisées
    supportFile: 'cypress/support/index.js',
    scrollBehavior: 'center',
  },
});
