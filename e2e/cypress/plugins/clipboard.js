/**
 * Pour accéder au contenu au presse-papier depuis les tests
 * car cy.window().its('navigator.clipboard').invoke('readText')
 * ne fonctionne pas toujours correctement
 */

module.exports = (on, config) => {
  on('task', {
    getClipboard: () =>
      // clipboardy est exposé en ESM uniquement, il faut donc utilier un import
      // dynamique pour que ça fonctionne
      // Ref: https://github.com/sindresorhus/clipboardy/issues/77
      import('clipboardy').then(({ default: clipboardy }) =>
        clipboardy.readSync()
      ),
  });
};
