import { LocalSelectors } from './selectors';

// enregistre les définitions locales
beforeEach(() => {
  console.log('ok');
  cy.wrap(LocalSelectors).as('LocalSelectors');
});
