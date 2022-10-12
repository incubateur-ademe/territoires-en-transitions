/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */

const { isFileExist, findFiles } = require('cy-verify-downloads');
const cucumber = require('cypress-cucumber-preprocessor').default;
const pg = require('./pg');
const supabase = require('./supabase');
const clipboard = require('./clipboard');
const validateZip = require('./validateZip');

// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // init. avant lancement du navigateur
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.family === 'firefox') {
      // force la langue dans ff pour faire passer les tests en CI
      launchOptions.preferences['intl.locale.requested'] = 'fr-FR';
      return launchOptions;
    }
  });

  // pré-traitement des fichiers Gherkin
  on('file:preprocessor', cucumber());
  // pour vérifier les fichiers téléchargés
  on('task', { isFileExist, findFiles });
  // pour accéder au client postgres
  pg(on, config);
  // pour accéder au client supabase
  supabase(on, config);
  // pour accéder au contenu du presse-papier
  clipboard(on, config);
  // pour vérifier le contenu d'un zip
  validateZip(on, config);
};
