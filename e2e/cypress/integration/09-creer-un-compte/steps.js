import {defineStep} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

defineStep(/le bouton compte contient le texte "([^"]+)"/, message => {
  cy.get('[data-test="connectedMenu"] button').should('contain', message);
});
