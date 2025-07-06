const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const {
  addCucumberPreprocessorPlugin,
} = require('@badeball/cypress-cucumber-preprocessor');
const {
  createEsbuildPlugin,
} = require('@badeball/cypress-cucumber-preprocessor/esbuild');
const {
  NodeModulesPolyfillPlugin,
} = require('@esbuild-plugins/node-modules-polyfill');

const {isFileExist, findFiles} = require('cy-verify-downloads');
const supabase = require('./supabase');
const clipboard = require('./clipboard');
const validateZip = require('./validateZip');

/** Ajoute les plugins dans la configuration */
module.exports = async (on, config) => {
  // pour permettre la génération des rapports de tests
  await addCucumberPreprocessorPlugin(on, config);

  // init. avant lancement du navigateur
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.family === 'firefox') {
      // force la langue dans ff pour faire passer les tests en CI
      launchOptions.preferences['intl.locale.requested'] = 'fr-FR';
      return launchOptions;
    }
  });

  // pré-traitement des scénarios de tests
  on(
    'file:preprocessor',
    // on utilise le bundler esbuild (nettement plus rapide que webpack+babel)
    createBundler({
      plugins: [
        // ajoute un polyfill pour les modules node js (path, fs, etc.) afin
        // d'éviter une erreurs avec les commandes fournies par cy-verify-downloads
        // Ref: https://github.com/elaichenkov/cy-verify-downloads/issues/51#issuecomment-1237978973
        NodeModulesPolyfillPlugin(),
        // ajoute le pré-processeur Gherkin
        createEsbuildPlugin(config),
      ],
    })
  );

  // pour vérifier les fichiers téléchargés
  on('task', {isFileExist, findFiles});
  // pour accéder au client supabase
  supabase(on, config);
  // pour accéder au contenu du presse-papier
  clipboard(on, config);
  // pour vérifier le contenu d'un zip
  validateZip(on, config);

  // redirige les logs cypress dans la console quand un test échoue (utile pour
  // comprendre les échecs en CI)
  require('cypress-terminal-report/src/installLogsPrinter')(on);

  // renvoie la configuration mise à jour par les plugins
  return config;
};
